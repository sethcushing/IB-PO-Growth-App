from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'apo-assessment-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

app = FastAPI(title="APO Product Owner Assessment API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ ENUMS ============
class UserRole(str, Enum):
    PRODUCT_OWNER = "ProductOwner"
    AGILE_COACH = "AgileCoach"
    MANAGER = "Manager"
    EXEC_VIEWER = "ExecViewer"
    ADMIN = "Admin"

class RaterType(str, Enum):
    SELF = "Self"
    COACH = "Coach"
    MANAGER = "Manager"

class CycleStatus(str, Enum):
    DRAFT = "Draft"
    ACTIVE = "Active"
    CLOSED = "Closed"

class MaturityBand(str, Enum):
    FOUNDATIONAL = "Foundational"
    DEVELOPING = "Developing"
    PERFORMING = "Performing"
    LEADING = "Leading"
    ELITE = "Elite"

# ============ PYDANTIC MODELS ============
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: UserRole
    org_unit: Optional[str] = None
    team: Optional[str] = None
    title: Optional[str] = None
    manager_id: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole = UserRole.PRODUCT_OWNER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class ProductOwner(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    product_area: str
    tenure_months: int = 0
    level: str = "IC"

class Dimension(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    weight: int
    order: int

class Question(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    dimension_id: str
    text_self: str
    text_coach: str
    text_manager: str
    active: bool = True
    order: int
    help_text: Optional[str] = None
    rubric_hints: Optional[Dict[str, str]] = None

class AssessmentCycle(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    start_date: datetime
    end_date: datetime
    status: CycleStatus = CycleStatus.DRAFT
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Assignment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    cycle_id: str
    po_id: str
    manager_user_id: str
    partner_user_ids: List[str] = []

class ResponseItem(BaseModel):
    question_id: str
    score: Optional[int] = None  # 1-5 or None for NA
    comment: Optional[str] = None

class ResponseCreate(BaseModel):
    cycle_id: str
    po_id: str
    rater_type: RaterType
    items: List[ResponseItem]

class Response(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    cycle_id: str
    po_id: str
    rater_user_id: str
    rater_type: RaterType
    submitted_at: Optional[datetime] = None
    completion_pct: float = 0.0
    items: List[ResponseItem] = []
    is_draft: bool = True

class DimensionScore(BaseModel):
    dimension_id: str
    dimension_name: str
    self_score: Optional[float] = None
    partner_avg_score: Optional[float] = None
    manager_score: Optional[float] = None
    delta_self_partner: Optional[float] = None
    delta_self_manager: Optional[float] = None
    weight: int

class Scorecard(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    cycle_id: str
    po_id: str
    po_name: str
    po_team: str
    computed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    overall_self: Optional[float] = None
    overall_partner_avg: Optional[float] = None
    overall_manager: Optional[float] = None
    alignment_index: Optional[float] = None
    confidence_score: float = 0.0
    maturity_band: MaturityBand = MaturityBand.FOUNDATIONAL
    dimension_scores: List[DimensionScore] = []
    partner_count: int = 0
    flags: List[str] = []

# ============ AUTH HELPERS ============
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ AUTH ENDPOINTS ============
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        org_unit="Demo Organization",
        team="Demo Team"
    )
    hashed_pw = hash_password(user_data.password)
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    user_dict['password_hash'] = hashed_pw
    
    await db.users.insert_one(user_dict)
    
    token = create_token(user.id, user.email, user.role.value)
    user_response = {k: v for k, v in user_dict.items() if k != 'password_hash' and k != '_id'}
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user.get('password_hash', '')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user['id'], user['email'], user['role'])
    user_response = {k: v for k, v in user.items() if k != 'password_hash'}
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/auth/me")
async def get_me(current_user: Dict = Depends(get_current_user)):
    return {k: v for k, v in current_user.items() if k != 'password_hash'}

# ============ DIMENSIONS & QUESTIONS ============
@api_router.get("/dimensions")
async def get_dimensions():
    dimensions = await db.dimensions.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return dimensions

@api_router.get("/questions")
async def get_questions(dimension_id: Optional[str] = None):
    query = {"active": True}
    if dimension_id:
        query["dimension_id"] = dimension_id
    questions = await db.questions.find(query, {"_id": 0}).sort("order", 1).to_list(100)
    return questions

@api_router.get("/questions/by-dimension")
async def get_questions_by_dimension():
    dimensions = await db.dimensions.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    questions = await db.questions.find({"active": True}, {"_id": 0}).sort("order", 1).to_list(100)
    
    result = []
    for dim in dimensions:
        dim_questions = [q for q in questions if q['dimension_id'] == dim['id']]
        result.append({**dim, "questions": dim_questions})
    return result

# ============ ASSESSMENT CYCLES ============
@api_router.get("/cycles")
async def get_cycles():
    cycles = await db.assessment_cycles.find({}, {"_id": 0}).sort("start_date", -1).to_list(100)
    return cycles

@api_router.get("/cycles/active")
async def get_active_cycle():
    cycle = await db.assessment_cycles.find_one({"status": CycleStatus.ACTIVE.value}, {"_id": 0})
    if not cycle:
        # Return first cycle if none active
        cycle = await db.assessment_cycles.find_one({}, {"_id": 0})
    return cycle

@api_router.post("/cycles")
async def create_cycle(cycle: AssessmentCycle, current_user: Dict = Depends(get_current_user)):
    if current_user['role'] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    cycle_dict = cycle.model_dump()
    cycle_dict['start_date'] = cycle_dict['start_date'].isoformat()
    cycle_dict['end_date'] = cycle_dict['end_date'].isoformat()
    cycle_dict['created_at'] = cycle_dict['created_at'].isoformat()
    
    await db.assessment_cycles.insert_one(cycle_dict)
    return cycle_dict

# ============ ASSIGNMENTS ============
@api_router.get("/assignments/my")
async def get_my_assignments(current_user: Dict = Depends(get_current_user)):
    user_id = current_user['id']
    role = current_user['role']
    
    cycle = await db.assessment_cycles.find_one({"status": CycleStatus.ACTIVE.value}, {"_id": 0})
    if not cycle:
        cycle = await db.assessment_cycles.find_one({}, {"_id": 0})
    if not cycle:
        return []
    
    assignments = []
    
    if role == UserRole.PRODUCT_OWNER.value:
        # Find PO record for this user
        po = await db.product_owners.find_one({"user_id": user_id}, {"_id": 0})
        if po:
            assignment = await db.assignments.find_one({
                "cycle_id": cycle['id'],
                "po_id": po['id']
            }, {"_id": 0})
            if assignment:
                # Check if self-assessment exists
                response = await db.responses.find_one({
                    "cycle_id": cycle['id'],
                    "po_id": po['id'],
                    "rater_user_id": user_id,
                    "rater_type": RaterType.SELF.value
                }, {"_id": 0})
                
                assignments.append({
                    "assignment_id": assignment['id'],
                    "cycle_id": cycle['id'],
                    "cycle_name": cycle['name'],
                    "po_id": po['id'],
                    "po_name": current_user['name'],
                    "rater_type": "Self",
                    "status": "Completed" if response and not response.get('is_draft', True) else "Pending",
                    "completion_pct": response.get('completion_pct', 0) if response else 0
                })
    
    elif role == UserRole.BUSINESS_PARTNER.value:
        # Find all assignments where user is a partner
        partner_assignments = await db.assignments.find({
            "cycle_id": cycle['id'],
            "partner_user_ids": user_id
        }, {"_id": 0}).to_list(100)
        
        for assgn in partner_assignments:
            po = await db.product_owners.find_one({"id": assgn['po_id']}, {"_id": 0})
            po_user = await db.users.find_one({"id": po['user_id']}, {"_id": 0}) if po else None
            
            response = await db.responses.find_one({
                "cycle_id": cycle['id'],
                "po_id": assgn['po_id'],
                "rater_user_id": user_id,
                "rater_type": RaterType.COACH.value
            }, {"_id": 0})
            
            assignments.append({
                "assignment_id": assgn['id'],
                "cycle_id": cycle['id'],
                "cycle_name": cycle['name'],
                "po_id": assgn['po_id'],
                "po_name": po_user['name'] if po_user else "Unknown PO",
                "rater_type": "Partner",
                "status": "Completed" if response and not response.get('is_draft', True) else "Pending",
                "completion_pct": response.get('completion_pct', 0) if response else 0
            })
    
    elif role == UserRole.MANAGER.value:
        # Find all assignments where user is manager
        manager_assignments = await db.assignments.find({
            "cycle_id": cycle['id'],
            "manager_user_id": user_id
        }, {"_id": 0}).to_list(100)
        
        for assgn in manager_assignments:
            po = await db.product_owners.find_one({"id": assgn['po_id']}, {"_id": 0})
            po_user = await db.users.find_one({"id": po['user_id']}, {"_id": 0}) if po else None
            
            response = await db.responses.find_one({
                "cycle_id": cycle['id'],
                "po_id": assgn['po_id'],
                "rater_user_id": user_id,
                "rater_type": RaterType.MANAGER.value
            }, {"_id": 0})
            
            assignments.append({
                "assignment_id": assgn['id'],
                "cycle_id": cycle['id'],
                "cycle_name": cycle['name'],
                "po_id": assgn['po_id'],
                "po_name": po_user['name'] if po_user else "Unknown PO",
                "rater_type": "Manager",
                "status": "Completed" if response and not response.get('is_draft', True) else "Pending",
                "completion_pct": response.get('completion_pct', 0) if response else 0
            })
    
    return assignments

@api_router.get("/assignments")
async def get_all_assignments(current_user: Dict = Depends(get_current_user)):
    if current_user['role'] not in [UserRole.ADMIN.value, UserRole.EXEC_VIEWER.value]:
        raise HTTPException(status_code=403, detail="Admin/ExecViewer access required")
    
    assignments = await db.assignments.find({}, {"_id": 0}).to_list(1000)
    return assignments

# ============ RESPONSES ============
@api_router.post("/responses")
async def save_response(response_data: ResponseCreate, current_user: Dict = Depends(get_current_user)):
    # Check if response already exists
    existing = await db.responses.find_one({
        "cycle_id": response_data.cycle_id,
        "po_id": response_data.po_id,
        "rater_user_id": current_user['id'],
        "rater_type": response_data.rater_type.value
    }, {"_id": 0})
    
    total_questions = await db.questions.count_documents({"active": True})
    answered = len([i for i in response_data.items if i.score is not None])
    completion_pct = (answered / total_questions * 100) if total_questions > 0 else 0
    
    response_dict = {
        "id": existing['id'] if existing else str(uuid.uuid4()),
        "cycle_id": response_data.cycle_id,
        "po_id": response_data.po_id,
        "rater_user_id": current_user['id'],
        "rater_type": response_data.rater_type.value,
        "items": [item.model_dump() for item in response_data.items],
        "completion_pct": completion_pct,
        "is_draft": True,
        "submitted_at": None
    }
    
    if existing:
        await db.responses.update_one(
            {"id": existing['id']},
            {"$set": response_dict}
        )
    else:
        await db.responses.insert_one(response_dict)
    
    return response_dict

@api_router.post("/responses/submit")
async def submit_response(response_data: ResponseCreate, current_user: Dict = Depends(get_current_user)):
    total_questions = await db.questions.count_documents({"active": True})
    answered = len([i for i in response_data.items if i.score is not None])
    completion_pct = (answered / total_questions * 100) if total_questions > 0 else 0
    
    existing = await db.responses.find_one({
        "cycle_id": response_data.cycle_id,
        "po_id": response_data.po_id,
        "rater_user_id": current_user['id'],
        "rater_type": response_data.rater_type.value
    }, {"_id": 0})
    
    response_dict = {
        "id": existing['id'] if existing else str(uuid.uuid4()),
        "cycle_id": response_data.cycle_id,
        "po_id": response_data.po_id,
        "rater_user_id": current_user['id'],
        "rater_type": response_data.rater_type.value,
        "items": [item.model_dump() for item in response_data.items],
        "completion_pct": completion_pct,
        "is_draft": False,
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    
    if existing:
        await db.responses.update_one(
            {"id": existing['id']},
            {"$set": response_dict}
        )
    else:
        await db.responses.insert_one(response_dict)
    
    # Trigger scorecard recompute
    await compute_scorecard(response_data.cycle_id, response_data.po_id)
    
    return response_dict

@api_router.get("/responses/{cycle_id}/{po_id}")
async def get_response(cycle_id: str, po_id: str, current_user: Dict = Depends(get_current_user)):
    # Determine rater type based on user role
    role = current_user['role']
    user_id = current_user['id']
    
    if role == UserRole.PRODUCT_OWNER.value:
        rater_type = RaterType.SELF.value
    elif role == UserRole.BUSINESS_PARTNER.value:
        rater_type = RaterType.COACH.value
    elif role == UserRole.MANAGER.value:
        rater_type = RaterType.MANAGER.value
    else:
        # Admin/ExecViewer - return all responses
        responses = await db.responses.find({
            "cycle_id": cycle_id,
            "po_id": po_id,
            "is_draft": False
        }, {"_id": 0}).to_list(100)
        return responses
    
    response = await db.responses.find_one({
        "cycle_id": cycle_id,
        "po_id": po_id,
        "rater_user_id": user_id,
        "rater_type": rater_type
    }, {"_id": 0})
    
    return response

@api_router.get("/responses/{cycle_id}/{po_id}/full")
async def get_response_full(cycle_id: str, po_id: str, rater_type: Optional[str] = None, current_user: Dict = Depends(get_current_user)):
    """Get full response with question details for viewing"""
    role = current_user['role']
    user_id = current_user['id']
    
    # Determine which rater type to fetch
    if rater_type:
        target_rater_type = rater_type
    elif role == UserRole.PRODUCT_OWNER.value:
        target_rater_type = RaterType.SELF.value
    elif role == UserRole.BUSINESS_PARTNER.value:
        target_rater_type = RaterType.COACH.value
    elif role == UserRole.MANAGER.value:
        target_rater_type = RaterType.MANAGER.value
    else:
        target_rater_type = RaterType.SELF.value
    
    # Get response
    query = {
        "cycle_id": cycle_id,
        "po_id": po_id,
        "rater_type": target_rater_type
    }
    
    # For non-admin users, also filter by user_id
    if role not in [UserRole.ADMIN.value, UserRole.EXEC_VIEWER.value]:
        query["rater_user_id"] = user_id
    
    response = await db.responses.find_one(query, {"_id": 0})
    
    if not response:
        return None
    
    # Enrich with question and dimension data
    dimensions = await db.dimensions.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    questions = await db.questions.find({"active": True}, {"_id": 0}).sort("order", 1).to_list(100)
    
    # Build enriched response
    enriched_items = []
    for item in response.get('items', []):
        question = next((q for q in questions if q['id'] == item['question_id']), None)
        if question:
            dimension = next((d for d in dimensions if d['id'] == question['dimension_id']), None)
            enriched_items.append({
                **item,
                "question": question,
                "dimension": dimension
            })
    
    response['enriched_items'] = enriched_items
    return response

# ============ SCORECARDS ============
def get_maturity_band(score: float) -> MaturityBand:
    if score < 25:
        return MaturityBand.FOUNDATIONAL
    elif score < 45:
        return MaturityBand.DEVELOPING
    elif score < 65:
        return MaturityBand.PERFORMING
    elif score < 85:
        return MaturityBand.LEADING
    else:
        return MaturityBand.ELITE

async def compute_scorecard(cycle_id: str, po_id: str):
    """Compute or recompute scorecard for a PO"""
    dimensions = await db.dimensions.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    questions = await db.questions.find({"active": True}, {"_id": 0}).to_list(100)
    
    # Get all submitted responses for this PO
    responses = await db.responses.find({
        "cycle_id": cycle_id,
        "po_id": po_id,
        "is_draft": False
    }, {"_id": 0}).to_list(100)
    
    self_response = next((r for r in responses if r['rater_type'] == RaterType.SELF.value), None)
    partner_responses = [r for r in responses if r['rater_type'] == RaterType.COACH.value]
    manager_response = next((r for r in responses if r['rater_type'] == RaterType.MANAGER.value), None)
    
    # Get PO info
    po = await db.product_owners.find_one({"id": po_id}, {"_id": 0})
    po_user = await db.users.find_one({"id": po['user_id']}, {"_id": 0}) if po else None
    
    dimension_scores = []
    total_self = 0
    total_partner = 0
    total_manager = 0
    total_weight = 0
    deltas = []
    
    for dim in dimensions:
        dim_questions = [q for q in questions if q['dimension_id'] == dim['id']]
        if not dim_questions:
            continue
        
        # Calculate self score
        self_score = None
        if self_response:
            scores = []
            for q in dim_questions:
                item = next((i for i in self_response.get('items', []) if i['question_id'] == q['id']), None)
                if item and item.get('score') is not None:
                    normalized = (item['score'] - 1) / 4 * 100
                    scores.append(normalized)
            if scores:
                self_score = sum(scores) / len(scores)
        
        # Calculate partner avg
        partner_avg = None
        if partner_responses:
            all_partner_scores = []
            for pr in partner_responses:
                for q in dim_questions:
                    item = next((i for i in pr.get('items', []) if i['question_id'] == q['id']), None)
                    if item and item.get('score') is not None:
                        normalized = (item['score'] - 1) / 4 * 100
                        all_partner_scores.append(normalized)
            if all_partner_scores:
                partner_avg = sum(all_partner_scores) / len(all_partner_scores)
        
        # Calculate manager score
        manager_score = None
        if manager_response:
            scores = []
            for q in dim_questions:
                item = next((i for i in manager_response.get('items', []) if i['question_id'] == q['id']), None)
                if item and item.get('score') is not None:
                    normalized = (item['score'] - 1) / 4 * 100
                    scores.append(normalized)
            if scores:
                manager_score = sum(scores) / len(scores)
        
        # Calculate deltas
        delta_self_partner = None
        delta_self_manager = None
        if self_score is not None and partner_avg is not None:
            delta_self_partner = self_score - partner_avg
            deltas.append(abs(delta_self_partner))
        if self_score is not None and manager_score is not None:
            delta_self_manager = self_score - manager_score
            deltas.append(abs(delta_self_manager))
        
        dimension_scores.append(DimensionScore(
            dimension_id=dim['id'],
            dimension_name=dim['name'],
            self_score=round(self_score, 1) if self_score is not None else None,
            partner_avg_score=round(partner_avg, 1) if partner_avg is not None else None,
            manager_score=round(manager_score, 1) if manager_score is not None else None,
            delta_self_partner=round(delta_self_partner, 1) if delta_self_partner is not None else None,
            delta_self_manager=round(delta_self_manager, 1) if delta_self_manager is not None else None,
            weight=dim['weight']
        ))
        
        # Accumulate weighted scores
        weight = dim['weight'] / 100
        if self_score is not None:
            total_self += self_score * weight
            total_weight += weight
        if partner_avg is not None:
            total_partner += partner_avg * weight
        if manager_score is not None:
            total_manager += manager_score * weight
    
    # Calculate overall scores
    overall_self = round(total_self, 1) if self_response else None
    overall_partner = round(total_partner, 1) if partner_responses else None
    overall_manager = round(total_manager, 1) if manager_response else None
    
    # Calculate alignment index
    alignment_index = None
    if deltas:
        avg_delta = sum(deltas) / len(deltas)
        alignment_index = round(100 - avg_delta, 1)
    
    # Calculate confidence score
    confidence = 100
    if len(partner_responses) < 2:
        confidence -= 30
    if not manager_response:
        confidence -= 20
    if self_response and self_response.get('completion_pct', 0) < 85:
        confidence -= 20
    confidence_score = max(0, confidence)
    
    # Determine maturity band
    primary_score = overall_self if overall_self is not None else (overall_partner if overall_partner else 0)
    maturity_band = get_maturity_band(primary_score)
    
    # Generate flags
    flags = []
    high_misalign_count = 0
    coaching_priorities = []
    for ds in dimension_scores:
        if ds.delta_self_partner is not None and abs(ds.delta_self_partner) > 15:
            high_misalign_count += 1
        if ds.self_score is not None and ds.self_score < 50 and ds.weight >= 12:
            coaching_priorities.append(ds.dimension_name)
    
    if high_misalign_count >= 3:
        flags.append("High Misalignment")
    if coaching_priorities:
        flags.append(f"Coaching Priority: {', '.join(coaching_priorities[:2])}")
    if len(partner_responses) < 2:
        flags.append("Low Confidence (< 2 partners)")
    
    scorecard = Scorecard(
        cycle_id=cycle_id,
        po_id=po_id,
        po_name=po_user['name'] if po_user else "Unknown",
        po_team=po_user.get('team', '') if po_user else '',
        overall_self=overall_self,
        overall_partner_avg=overall_partner,
        overall_manager=overall_manager,
        alignment_index=alignment_index,
        confidence_score=confidence_score,
        maturity_band=maturity_band,
        dimension_scores=[ds.model_dump() for ds in dimension_scores],
        partner_count=len(partner_responses),
        flags=flags
    )
    
    scorecard_dict = scorecard.model_dump()
    scorecard_dict['computed_at'] = scorecard_dict['computed_at'].isoformat()
    
    # Upsert scorecard
    existing = await db.scorecards.find_one({"cycle_id": cycle_id, "po_id": po_id})
    if existing:
        await db.scorecards.update_one(
            {"cycle_id": cycle_id, "po_id": po_id},
            {"$set": scorecard_dict}
        )
    else:
        await db.scorecards.insert_one(scorecard_dict)
    
    return scorecard_dict

@api_router.get("/scorecards/my")
async def get_my_scorecard(cycle_id: Optional[str] = None, current_user: Dict = Depends(get_current_user)):
    po = await db.product_owners.find_one({"user_id": current_user['id']}, {"_id": 0})
    if not po:
        raise HTTPException(status_code=404, detail="No PO record found")
    
    # If cycle_id provided, use it; otherwise try active cycle
    if cycle_id:
        cycle = await db.assessment_cycles.find_one({"id": cycle_id}, {"_id": 0})
    else:
        cycle = await db.assessment_cycles.find_one({"status": CycleStatus.ACTIVE.value}, {"_id": 0})
        if not cycle:
            cycle = await db.assessment_cycles.find_one({}, {"_id": 0})
    
    if not cycle:
        raise HTTPException(status_code=404, detail="No assessment cycle found")
    
    scorecard = await db.scorecards.find_one({
        "cycle_id": cycle['id'],
        "po_id": po['id']
    }, {"_id": 0})
    
    # Check if scorecard has actual data (self assessment completed)
    if scorecard and scorecard.get('overall_self') is not None:
        return scorecard
    
    # If no data for active cycle, try to find historical scorecard
    if not cycle_id:  # Only auto-fallback when not explicitly requesting a cycle
        all_cycles = await db.assessment_cycles.find({}, {"_id": 0}).sort("start_date", -1).to_list(100)
        for hist_cycle in all_cycles:
            if hist_cycle['id'] == cycle['id']:
                continue
            hist_scorecard = await db.scorecards.find_one({
                "cycle_id": hist_cycle['id'],
                "po_id": po['id']
            }, {"_id": 0})
            if hist_scorecard and hist_scorecard.get('overall_self') is not None:
                hist_scorecard['_fallback_from_cycle'] = hist_cycle['name']
                return hist_scorecard
    
    # Return empty scorecard with indicator
    if not scorecard:
        scorecard = await compute_scorecard(cycle['id'], po['id'])
    
    scorecard['_no_data'] = True
    return scorecard

@api_router.get("/scorecards/{po_id}")
async def get_scorecard(po_id: str, current_user: Dict = Depends(get_current_user)):
    cycle = await db.assessment_cycles.find_one({"status": CycleStatus.ACTIVE.value}, {"_id": 0})
    if not cycle:
        cycle = await db.assessment_cycles.find_one({}, {"_id": 0})
    
    scorecard = await db.scorecards.find_one({
        "cycle_id": cycle['id'],
        "po_id": po_id
    }, {"_id": 0})
    
    if not scorecard:
        scorecard = await compute_scorecard(cycle['id'], po_id)
    
    return scorecard

@api_router.get("/scorecards")
async def get_all_scorecards(
    cycle_id: Optional[str] = None,
    team: Optional[str] = None,
    current_user: Dict = Depends(get_current_user)
):
    cycle = None
    if cycle_id:
        cycle = await db.assessment_cycles.find_one({"id": cycle_id}, {"_id": 0})
    else:
        cycle = await db.assessment_cycles.find_one({"status": CycleStatus.ACTIVE.value}, {"_id": 0})
        if not cycle:
            cycle = await db.assessment_cycles.find_one({}, {"_id": 0})
    
    if not cycle:
        return []
    
    query = {"cycle_id": cycle['id']}
    if team:
        query["po_team"] = team
    
    scorecards = await db.scorecards.find(query, {"_id": 0}).to_list(1000)
    return scorecards

# ============ MANAGER ENDPOINTS ============
@api_router.get("/manager/team")
async def get_manager_team(current_user: Dict = Depends(get_current_user)):
    if current_user['role'] not in [UserRole.MANAGER.value, UserRole.ADMIN.value, UserRole.EXEC_VIEWER.value]:
        raise HTTPException(status_code=403, detail="Manager access required")
    
    cycle = await db.assessment_cycles.find_one({"status": CycleStatus.ACTIVE.value}, {"_id": 0})
    if not cycle:
        cycle = await db.assessment_cycles.find_one({}, {"_id": 0})
    
    # Get assignments where user is manager
    assignments = await db.assignments.find({
        "cycle_id": cycle['id'],
        "manager_user_id": current_user['id']
    }, {"_id": 0}).to_list(100)
    
    team_data = []
    for assgn in assignments:
        po = await db.product_owners.find_one({"id": assgn['po_id']}, {"_id": 0})
        po_user = await db.users.find_one({"id": po['user_id']}, {"_id": 0}) if po else None
        
        scorecard = await db.scorecards.find_one({
            "cycle_id": cycle['id'],
            "po_id": assgn['po_id']
        }, {"_id": 0})
        
        # Calculate completion
        responses = await db.responses.find({
            "cycle_id": cycle['id'],
            "po_id": assgn['po_id'],
            "is_draft": False
        }, {"_id": 0}).to_list(100)
        
        completion = len(responses) / 3 * 100  # 3 rater types
        
        # Find biggest gap dimension
        biggest_gap = None
        if scorecard and scorecard.get('dimension_scores'):
            max_delta = 0
            for ds in scorecard['dimension_scores']:
                delta = abs(ds.get('delta_self_partner') or 0)
                if delta > max_delta:
                    max_delta = delta
                    biggest_gap = ds['dimension_name']
        
        team_data.append({
            "po_id": assgn['po_id'],
            "po_name": po_user['name'] if po_user else "Unknown",
            "role_level": po.get('level', 'IC') if po else 'IC',
            "team": po_user.get('team', '') if po_user else '',
            "completion_pct": round(completion, 0),
            "overall_score": scorecard.get('overall_self') if scorecard else None,
            "maturity_band": scorecard.get('maturity_band') if scorecard else None,
            "biggest_gap": biggest_gap,
            "flags": scorecard.get('flags', []) if scorecard else [],
            "alignment_index": scorecard.get('alignment_index') if scorecard else None
        })
    
    return team_data

# ============ EXECUTIVE DASHBOARD ============
@api_router.get("/executive/summary")
async def get_executive_summary(
    cycle_id: Optional[str] = None,
    team: Optional[str] = None,
    current_user: Dict = Depends(get_current_user)
):
    cycle = None
    if cycle_id:
        cycle = await db.assessment_cycles.find_one({"id": cycle_id}, {"_id": 0})
    else:
        cycle = await db.assessment_cycles.find_one({"status": CycleStatus.ACTIVE.value}, {"_id": 0})
        if not cycle:
            cycle = await db.assessment_cycles.find_one({}, {"_id": 0})
    
    if not cycle:
        return {"error": "No assessment cycle found"}
    
    query = {"cycle_id": cycle['id']}
    if team:
        query["po_team"] = team
    
    scorecards = await db.scorecards.find(query, {"_id": 0}).to_list(1000)
    
    if not scorecards:
        return {
            "cycle": cycle,
            "total_pos": 0,
            "avg_self": None,
            "avg_partner": None,
            "avg_manager": None,
            "avg_alignment": None,
            "completion_rate": 0,
            "maturity_distribution": {},
            "dimension_averages": [],
            "top_strengths": [],
            "top_gaps": []
        }
    
    # Calculate averages
    self_scores = [s['overall_self'] for s in scorecards if s.get('overall_self') is not None]
    partner_scores = [s['overall_partner_avg'] for s in scorecards if s.get('overall_partner_avg') is not None]
    manager_scores = [s['overall_manager'] for s in scorecards if s.get('overall_manager') is not None]
    alignment_scores = [s['alignment_index'] for s in scorecards if s.get('alignment_index') is not None]
    
    # Maturity distribution
    maturity_dist = {
        "Foundational": 0,
        "Developing": 0,
        "Performing": 0,
        "Leading": 0,
        "Elite": 0
    }
    for s in scorecards:
        band = s.get('maturity_band', 'Foundational')
        maturity_dist[band] = maturity_dist.get(band, 0) + 1
    
    # Calculate dimension averages
    dimensions = await db.dimensions.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    dimension_avgs = []
    for dim in dimensions:
        self_dim_scores = []
        partner_dim_scores = []
        manager_dim_scores = []
        for s in scorecards:
            for ds in s.get('dimension_scores', []):
                if ds['dimension_id'] == dim['id']:
                    if ds.get('self_score') is not None:
                        self_dim_scores.append(ds['self_score'])
                    if ds.get('partner_avg_score') is not None:
                        partner_dim_scores.append(ds['partner_avg_score'])
                    if ds.get('manager_score') is not None:
                        manager_dim_scores.append(ds['manager_score'])
        
        dimension_avgs.append({
            "dimension_id": dim['id'],
            "dimension_name": dim['name'],
            "weight": dim['weight'],
            "avg_self": round(sum(self_dim_scores) / len(self_dim_scores), 1) if self_dim_scores else None,
            "avg_partner": round(sum(partner_dim_scores) / len(partner_dim_scores), 1) if partner_dim_scores else None,
            "avg_manager": round(sum(manager_dim_scores) / len(manager_dim_scores), 1) if manager_dim_scores else None
        })
    
    # Top strengths and gaps
    sorted_by_score = sorted([d for d in dimension_avgs if d['avg_self'] is not None], key=lambda x: x['avg_self'], reverse=True)
    top_strengths = sorted_by_score[:3]
    top_gaps = sorted_by_score[-3:][::-1] if len(sorted_by_score) >= 3 else sorted_by_score[::-1]
    
    # Get unique teams
    teams = list(set([s.get('po_team', '') for s in scorecards if s.get('po_team')]))
    
    return {
        "cycle": cycle,
        "total_pos": len(scorecards),
        "avg_self": round(sum(self_scores) / len(self_scores), 1) if self_scores else None,
        "avg_partner": round(sum(partner_scores) / len(partner_scores), 1) if partner_scores else None,
        "avg_manager": round(sum(manager_scores) / len(manager_scores), 1) if manager_scores else None,
        "avg_alignment": round(sum(alignment_scores) / len(alignment_scores), 1) if alignment_scores else None,
        "completion_rate": round(len([s for s in scorecards if s.get('overall_self') is not None]) / len(scorecards) * 100, 0),
        "maturity_distribution": maturity_dist,
        "dimension_averages": dimension_avgs,
        "top_strengths": top_strengths,
        "top_gaps": top_gaps,
        "teams": teams,
        "scorecards": scorecards
    }

@api_router.get("/executive/heatmap")
async def get_heatmap_data(cycle_id: Optional[str] = None, current_user: Dict = Depends(get_current_user)):
    cycle = None
    if cycle_id:
        cycle = await db.assessment_cycles.find_one({"id": cycle_id}, {"_id": 0})
    else:
        cycle = await db.assessment_cycles.find_one({"status": CycleStatus.ACTIVE.value}, {"_id": 0})
        if not cycle:
            cycle = await db.assessment_cycles.find_one({}, {"_id": 0})
    
    if not cycle:
        return {"dimensions": [], "data": []}
    
    dimensions = await db.dimensions.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    scorecards = await db.scorecards.find({"cycle_id": cycle['id']}, {"_id": 0}).to_list(1000)
    
    heatmap_data = []
    for s in scorecards:
        row = {
            "po_id": s['po_id'],
            "po_name": s['po_name'],
            "team": s.get('po_team', ''),
            "scores": {}
        }
        for ds in s.get('dimension_scores', []):
            row["scores"][ds['dimension_id']] = ds.get('self_score')
        heatmap_data.append(row)
    
    return {
        "dimensions": [{"id": d['id'], "name": d['name']} for d in dimensions],
        "data": heatmap_data
    }

# ============ ADMIN ENDPOINTS ============
@api_router.get("/admin/users")
async def get_users(current_user: Dict = Depends(get_current_user)):
    if current_user['role'] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.get("/admin/product-owners")
async def get_product_owners(current_user: Dict = Depends(get_current_user)):
    pos = await db.product_owners.find({}, {"_id": 0}).to_list(1000)
    
    # Enrich with user data
    enriched = []
    for po in pos:
        user = await db.users.find_one({"id": po['user_id']}, {"_id": 0, "password_hash": 0})
        enriched.append({**po, "user": user})
    
    return enriched

@api_router.post("/admin/dimensions")
async def create_dimension(dimension: Dimension, current_user: Dict = Depends(get_current_user)):
    if current_user['role'] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    dim_dict = dimension.model_dump()
    await db.dimensions.insert_one(dim_dict)
    return dim_dict

@api_router.put("/admin/dimensions/{dim_id}")
async def update_dimension(dim_id: str, dimension: Dimension, current_user: Dict = Depends(get_current_user)):
    if current_user['role'] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    dim_dict = dimension.model_dump()
    await db.dimensions.update_one({"id": dim_id}, {"$set": dim_dict})
    return dim_dict

@api_router.post("/admin/questions")
async def create_question(question: Question, current_user: Dict = Depends(get_current_user)):
    if current_user['role'] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    q_dict = question.model_dump()
    await db.questions.insert_one(q_dict)
    return q_dict

@api_router.put("/admin/questions/{q_id}")
async def update_question(q_id: str, question: Question, current_user: Dict = Depends(get_current_user)):
    if current_user['role'] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    q_dict = question.model_dump()
    await db.questions.update_one({"id": q_id}, {"$set": q_dict})
    return q_dict

# ============ EXPORT ============
@api_router.get("/export/csv")
async def export_csv(cycle_id: Optional[str] = None, current_user: Dict = Depends(get_current_user)):
    if current_user['role'] not in [UserRole.ADMIN.value, UserRole.EXEC_VIEWER.value]:
        raise HTTPException(status_code=403, detail="Admin/ExecViewer access required")
    
    cycle = None
    if cycle_id:
        cycle = await db.assessment_cycles.find_one({"id": cycle_id}, {"_id": 0})
    else:
        cycle = await db.assessment_cycles.find_one({"status": CycleStatus.ACTIVE.value}, {"_id": 0})
        if not cycle:
            cycle = await db.assessment_cycles.find_one({}, {"_id": 0})
    
    scorecards = await db.scorecards.find({"cycle_id": cycle['id']}, {"_id": 0}).to_list(1000)
    dimensions = await db.dimensions.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    
    # Build CSV data
    headers = ["PO Name", "Team", "Overall Self", "Overall Partner", "Overall Manager", "Alignment Index", "Maturity Band"]
    for dim in dimensions:
        headers.extend([f"{dim['name']} (Self)", f"{dim['name']} (Partner)", f"{dim['name']} (Manager)"])
    
    rows = []
    for s in scorecards:
        row = [
            s['po_name'],
            s.get('po_team', ''),
            s.get('overall_self', ''),
            s.get('overall_partner_avg', ''),
            s.get('overall_manager', ''),
            s.get('alignment_index', ''),
            s.get('maturity_band', '')
        ]
        for dim in dimensions:
            ds = next((d for d in s.get('dimension_scores', []) if d['dimension_id'] == dim['id']), None)
            if ds:
                row.extend([ds.get('self_score', ''), ds.get('partner_avg_score', ''), ds.get('manager_score', '')])
            else:
                row.extend(['', '', ''])
        rows.append(row)
    
    return {"headers": headers, "rows": rows}

# ============ DEMO DATA SEEDING ============
@api_router.post("/seed-demo")
async def seed_demo_data():
    """Seed demo data for POC demonstration"""
    import random
    
    # Clear existing data
    await db.users.delete_many({})
    await db.product_owners.delete_many({})
    await db.dimensions.delete_many({})
    await db.questions.delete_many({})
    await db.assessment_cycles.delete_many({})
    await db.assignments.delete_many({})
    await db.responses.delete_many({})
    await db.scorecards.delete_many({})
    
    # Create dimensions with weights (sum = 100) - Updated to 7 dimensions
    dimensions_data = [
        {"name": "Strategy", "description": "Product vision, roadmap, and strategic alignment", "weight": 15, "order": 1},
        {"name": "Customer", "description": "User research, validation, and empathy", "weight": 15, "order": 2},
        {"name": "Backlog", "description": "Backlog health, prioritization methods", "weight": 14, "order": 3},
        {"name": "Delivery", "description": "Collaboration with Eng/Design/Data", "weight": 14, "order": 4},
        {"name": "Stakeholder Management", "description": "Communication, influence, alignment", "weight": 14, "order": 5},
        {"name": "Execution", "description": "Commitment delivery, continuous improvement", "weight": 14, "order": 6},
        {"name": "Data", "description": "Success metrics, evidence-based decisions", "weight": 14, "order": 7}
    ]
    
    dimensions = []
    for d in dimensions_data:
        dim = Dimension(name=d['name'], description=d['description'], weight=d['weight'], order=d['order'])
        dim_dict = dim.model_dump()
        await db.dimensions.insert_one(dim_dict)
        dimensions.append(dim_dict)
    
    # Create questions - Updated from document
    questions_by_dim = {
        "Strategy": [
            ("I can clearly explain our product vision and how we'll know if we're successful.", "They clearly share where the product is headed and what success looks like.", "They paint a clear picture of the product vision and tie it to real outcomes."),
            ("I turn our strategy into a roadmap that focuses on outcomes, not just features.", "They create roadmaps that focus on what we're trying to achieve, not just what we're building.", "They effectively translate strategy into outcome-focused plans."),
            ("Our team knows our key metrics and what we're aiming for — they could explain it to anyone.", "The team clearly understands what success looks like and can articulate our goals.", "They ensure the whole team understands and can communicate our success metrics.")
        ],
        "Customer": [
            ("I regularly talk to customers or users to make sure we're solving real problems.", "They make time to understand customer needs firsthand.", "They consistently engage with customers to validate problems."),
            ("Before we build something big, I do the research to reduce our risk of building the wrong thing.", "They do their homework before committing the team to major work.", "They use discovery effectively to de-risk delivery."),
            ("I can clearly describe the problems our users face and why they matter.", "They really understand user pain points and can explain them clearly.", "They show genuine empathy and deep understanding of user needs.")
        ],
        "Backlog": [
            ("I use a consistent approach to decide what's most important to work on.", "They have a clear method for deciding priorities.", "They demonstrate mature, consistent prioritization practices."),
            ("Our backlog is focused and doesn't have a bunch of outdated or irrelevant items cluttering it up.", "They keep the backlog clean and focused.", "They maintain excellent backlog hygiene.")
        ],
        "Delivery": [
            ("I work closely with engineering and design to shape solutions together, not just hand off requirements.", "They collaborate well with the delivery team rather than just handing things over.", "They demonstrate strong partnership with engineering and design."),
            ("I help manage scope when things get complicated and watch out for delivery risks.", "They help manage scope and flag risks before they become problems.", "They proactively mitigate delivery risks.")
        ],
        "Stakeholder Management": [
            ("I make sure stakeholders are aligned before we move forward on big decisions.", "They bring stakeholders together and build consensus.", "They ensure stakeholder alignment on key decisions."),
            ("I can navigate competing priorities without everything turning into an escalation.", "They handle competing demands without creating drama.", "They manage priority conflicts effectively.")
        ],
        "Execution": [
            ("When I commit to something, I deliver — or I let people know early if plans need to change.", "They're reliable — when they commit to something, it happens.", "They consistently meet commitments or communicate early when plans change."),
            ("I'm always looking for ways we can work better as a team.", "They're always trying to help the team improve.", "They consistently drive process improvement.")
        ],
        "Data": [
            ("Before we start building, I define how we'll measure success.", "They think about success metrics before the team starts building.", "They ensure metrics are defined upfront."),
            ("After we launch something, I check how it's performing and share what we learned.", "They follow up after launches to see how things are actually doing.", "They demonstrate strong post-launch discipline."),
            ("I can explain how our work connects to business outcomes that matter.", "They connect day-to-day work to real business value.", "They ensure work ties to measurable business outcomes.")
        ]
    }
    
    # Helpful guidance text for each dimension
    help_texts = {
        "Strategy": "Think about how well you communicate direction and connect work to meaningful results. Do people understand where you're headed and why?",
        "Customer": "Consider how often you engage with actual users and whether you validate assumptions before committing to solutions.",
        "Backlog": "Reflect on the clarity and organization of your backlog. Is it easy for the team to understand what's important and why?",
        "Delivery": "Think about your collaboration with engineering, design, and other teams. Are you a true partner in delivery?",
        "Stakeholder Management": "Consider how you build relationships and handle competing interests. Do stakeholders trust you?",
        "Execution": "Reflect on your track record of delivering on commitments and helping the team stay focused.",
        "Data": "Think about how you use data to inform decisions and measure success."
    }
    
    for dim in dimensions:
        qs = questions_by_dim.get(dim['name'], [])
        for i, (self_text, coach_text, manager_text) in enumerate(qs):
            q = Question(
                dimension_id=dim['id'],
                text_self=self_text,
                text_coach=coach_text,
                text_manager=manager_text,
                order=i + 1,
                help_text=help_texts.get(dim['name'], f"Think about your experience in {dim['name'].lower()}.")
            )
            await db.questions.insert_one(q.model_dump())
    
    questions = await db.questions.find({}, {"_id": 0}).to_list(100)
    
    # Create assessment cycle - Q4 2024 (completed)
    cycle_q4 = AssessmentCycle(
        name="Q4 2024 Assessment",
        start_date=datetime(2024, 10, 1, tzinfo=timezone.utc),
        end_date=datetime(2024, 12, 31, tzinfo=timezone.utc),
        status=CycleStatus.CLOSED
    )
    cycle_q4_dict = cycle_q4.model_dump()
    cycle_q4_dict['start_date'] = cycle_q4_dict['start_date'].isoformat()
    cycle_q4_dict['end_date'] = cycle_q4_dict['end_date'].isoformat()
    cycle_q4_dict['created_at'] = cycle_q4_dict['created_at'].isoformat()
    await db.assessment_cycles.insert_one(cycle_q4_dict)
    
    # Create assessment cycle - Q1 2025 (active with pending)
    cycle = AssessmentCycle(
        name="Q1 2025 Assessment",
        start_date=datetime(2025, 1, 1, tzinfo=timezone.utc),
        end_date=datetime(2025, 3, 31, tzinfo=timezone.utc),
        status=CycleStatus.ACTIVE
    )
    cycle_dict = cycle.model_dump()
    cycle_dict['start_date'] = cycle_dict['start_date'].isoformat()
    cycle_dict['end_date'] = cycle_dict['end_date'].isoformat()
    cycle_dict['created_at'] = cycle_dict['created_at'].isoformat()
    await db.assessment_cycles.insert_one(cycle_dict)
    
    # Create demo users
    teams = ["Payments", "Growth", "Core Platform"]
    
    # Admin user
    admin_user = User(
        email="admin@company.com",
        name="Sarah Admin",
        role=UserRole.ADMIN,
        org_unit="Product",
        team="Leadership",
        title="Head of Product"
    )
    admin_dict = admin_user.model_dump()
    admin_dict['created_at'] = admin_dict['created_at'].isoformat()
    admin_dict['password_hash'] = hash_password("demo123")
    await db.users.insert_one(admin_dict)
    
    # ExecViewer
    exec_user = User(
        email="exec@company.com",
        name="Michael Exec",
        role=UserRole.EXEC_VIEWER,
        org_unit="Product",
        team="Leadership",
        title="VP Product"
    )
    exec_dict = exec_user.model_dump()
    exec_dict['created_at'] = exec_dict['created_at'].isoformat()
    exec_dict['password_hash'] = hash_password("demo123")
    await db.users.insert_one(exec_dict)
    
    # Managers (one per team)
    managers = []
    manager_names = [("James Chen", "Payments"), ("Emily Rodriguez", "Growth"), ("David Kim", "Core Platform")]
    for name, team in manager_names:
        mgr = User(
            email=f"{name.lower().replace(' ', '.')}@company.com",
            name=name,
            role=UserRole.MANAGER,
            org_unit="Product",
            team=team,
            title="Senior Product Manager"
        )
        mgr_dict = mgr.model_dump()
        mgr_dict['created_at'] = mgr_dict['created_at'].isoformat()
        mgr_dict['password_hash'] = hash_password("demo123")
        await db.users.insert_one(mgr_dict)
        managers.append(mgr_dict)
    
    # Product Owners (12 total, 4 per team)
    po_data = [
        # Payments team
        ("Alex Johnson", "Payments", "IC3", 24),
        ("Maria Garcia", "Payments", "IC2", 18),
        ("Ryan Smith", "Payments", "IC4", 36),
        ("Jessica Lee", "Payments", "IC2", 12),
        # Growth team
        ("Chris Brown", "Growth", "IC3", 30),
        ("Amanda White", "Growth", "IC2", 15),
        ("Kevin Davis", "Growth", "IC3", 24),
        ("Stephanie Wilson", "Growth", "IC4", 42),
        # Core Platform team
        ("Brandon Taylor", "Core Platform", "IC3", 20),
        ("Nicole Anderson", "Core Platform", "IC2", 10),
        ("Justin Martinez", "Core Platform", "IC4", 48),
        ("Michelle Thomas", "Core Platform", "IC3", 28)
    ]
    
    product_owners = []
    for name, team, level, tenure in po_data:
        po_user = User(
            email=f"{name.lower().replace(' ', '.')}@company.com",
            name=name,
            role=UserRole.PRODUCT_OWNER,
            org_unit="Product",
            team=team,
            title=f"Product Owner ({level})"
        )
        po_user_dict = po_user.model_dump()
        po_user_dict['created_at'] = po_user_dict['created_at'].isoformat()
        po_user_dict['password_hash'] = hash_password("demo123")
        await db.users.insert_one(po_user_dict)
        
        po = ProductOwner(
            user_id=po_user.id,
            product_area=team,
            tenure_months=tenure,
            level=level
        )
        po_dict = po.model_dump()
        await db.product_owners.insert_one(po_dict)
        product_owners.append({**po_dict, "user": po_user_dict, "team": team})
    
    # Business Partners (8 total)
    bp_names = [
        ("Lisa Wang", "Engineering"),
        ("Mark Johnson", "Design"),
        ("Sarah Miller", "Data"),
        ("Tom Anderson", "Operations"),
        ("Jennifer Lee", "Marketing"),
        ("Robert Brown", "Finance"),
        ("Amy Chen", "Legal"),
        ("Daniel Smith", "Customer Success")
    ]
    
    business_partners = []
    for name, dept in bp_names:
        bp = User(
            email=f"{name.lower().replace(' ', '.')}@company.com",
            name=name,
            role=UserRole.AGILE_COACH,
            org_unit=dept,
            team=dept,
            title=f"{dept} Lead"
        )
        bp_dict = bp.model_dump()
        bp_dict['created_at'] = bp_dict['created_at'].isoformat()
        bp_dict['password_hash'] = hash_password("demo123")
        await db.users.insert_one(bp_dict)
        business_partners.append(bp_dict)
    
    # Create assignments and responses
    sample_comments = [
        "Consistently demonstrates strong capabilities in this area.",
        "Has shown improvement over the past quarter.",
        "Could benefit from more structured approach.",
        "Excellent communication and follow-through.",
        "Sometimes struggles with competing priorities.",
        "Very responsive and collaborative.",
        "Would benefit from more data-driven approach.",
        "Strong leadership and vision.",
        "Needs to improve stakeholder alignment.",
        "Great at building consensus."
    ]
    
    for idx, po in enumerate(product_owners):
        # Find manager for this team
        manager = next((m for m in managers if m['team'] == po['team']), managers[0])
        
        # Assign 2-4 random partners
        num_partners = random.randint(2, 4)
        assigned_partners = random.sample(business_partners, num_partners)
        
        # Create assignments for BOTH cycles
        for cyc in [cycle_q4, cycle]:
            assignment = Assignment(
                cycle_id=cyc.id,
                po_id=po['id'],
                manager_user_id=manager['id'],
                partner_user_ids=[p['id'] for p in assigned_partners]
            )
            await db.assignments.insert_one(assignment.model_dump())
        
        # Generate score patterns
        # Some POs over-rate themselves, some under-rate
        score_pattern = random.choice(['overrate', 'underrate', 'aligned', 'high', 'low'])
        
        def generate_scores(base_modifier=0):
            items = []
            for q in questions:
                if random.random() < 0.05:  # 5% NA
                    items.append({"question_id": q['id'], "score": None, "comment": None})
                else:
                    base = random.randint(2, 4) + base_modifier
                    score = max(1, min(5, base + random.randint(-1, 1)))
                    comment = random.choice(sample_comments) if random.random() < 0.2 else None
                    items.append({"question_id": q['id'], "score": score, "comment": comment})
            return items
        
        # === Q4 2024 CYCLE - All completed (historical data) ===
        # Self response
        if score_pattern == 'overrate':
            self_items = generate_scores(1)
        elif score_pattern == 'underrate':
            self_items = generate_scores(-1)
        elif score_pattern == 'high':
            self_items = generate_scores(1)
        elif score_pattern == 'low':
            self_items = generate_scores(-1)
        else:
            self_items = generate_scores(0)
        
        self_response_q4 = {
            "id": str(uuid.uuid4()),
            "cycle_id": cycle_q4.id,
            "po_id": po['id'],
            "rater_user_id": po['user']['id'],
            "rater_type": RaterType.SELF.value,
            "items": self_items,
            "completion_pct": 100,
            "is_draft": False,
            "submitted_at": datetime(2024, 12, 15, tzinfo=timezone.utc).isoformat()
        }
        await db.responses.insert_one(self_response_q4)
        
        # Partner responses for Q4
        for partner in assigned_partners:
            if random.random() < 0.1:
                continue
            
            if score_pattern == 'overrate':
                partner_items = generate_scores(-1)
            elif score_pattern == 'underrate':
                partner_items = generate_scores(1)
            else:
                partner_items = generate_scores(0)
            
            partner_response_q4 = {
                "id": str(uuid.uuid4()),
                "cycle_id": cycle_q4.id,
                "po_id": po['id'],
                "rater_user_id": partner['id'],
                "rater_type": RaterType.COACH.value,
                "items": partner_items,
                "completion_pct": 100,
                "is_draft": False,
                "submitted_at": datetime(2024, 12, 18, tzinfo=timezone.utc).isoformat()
            }
            await db.responses.insert_one(partner_response_q4)
        
        # Manager response for Q4
        if score_pattern == 'underrate':
            mgr_items = generate_scores(1)
        elif score_pattern == 'high':
            mgr_items = generate_scores(1)
        else:
            mgr_items = generate_scores(0)
        
        mgr_response_q4 = {
            "id": str(uuid.uuid4()),
            "cycle_id": cycle_q4.id,
            "po_id": po['id'],
            "rater_user_id": manager['id'],
            "rater_type": RaterType.MANAGER.value,
            "items": mgr_items,
            "completion_pct": 100,
            "is_draft": False,
            "submitted_at": datetime(2024, 12, 20, tzinfo=timezone.utc).isoformat()
        }
        await db.responses.insert_one(mgr_response_q4)
        
        # Compute Q4 scorecard
        await compute_scorecard(cycle_q4.id, po['id'])
        
        # === Q1 2025 CYCLE - Some pending ===
        # First 3 POs (idx 0,1,2) have PENDING self-assessments
        # Next 3 POs (idx 3,4,5) have completed self but pending partner/manager
        # Rest have all completed
        
        if idx < 3:
            # Pending self-assessment (no response created)
            pass
        else:
            # Create self response
            self_response = {
                "id": str(uuid.uuid4()),
                "cycle_id": cycle.id,
                "po_id": po['id'],
                "rater_user_id": po['user']['id'],
                "rater_type": RaterType.SELF.value,
                "items": generate_scores(0),
                "completion_pct": 100,
                "is_draft": False,
                "submitted_at": datetime.now(timezone.utc).isoformat()
            }
            await db.responses.insert_one(self_response)
        
        if idx < 6:
            # Pending partner assessments for first 6 POs
            pass
        else:
            # Partner responses
            for partner in assigned_partners:
                if random.random() < 0.15:
                    continue
                
                partner_response = {
                    "id": str(uuid.uuid4()),
                    "cycle_id": cycle.id,
                    "po_id": po['id'],
                    "rater_user_id": partner['id'],
                    "rater_type": RaterType.COACH.value,
                    "items": generate_scores(0),
                    "completion_pct": 100,
                    "is_draft": False,
                    "submitted_at": datetime.now(timezone.utc).isoformat()
                }
                await db.responses.insert_one(partner_response)
        
        if idx < 6:
            # Pending manager assessments for first 6 POs
            pass
        else:
            # Manager response
            mgr_response = {
                "id": str(uuid.uuid4()),
                "cycle_id": cycle.id,
                "po_id": po['id'],
                "rater_user_id": manager['id'],
                "rater_type": RaterType.MANAGER.value,
                "items": generate_scores(0),
                "completion_pct": 100,
                "is_draft": False,
                "submitted_at": datetime.now(timezone.utc).isoformat()
            }
            await db.responses.insert_one(mgr_response)
        
        # Compute Q1 scorecard if any responses exist
        if idx >= 3:
            await compute_scorecard(cycle.id, po['id'])
    
    return {
        "status": "success",
        "message": "Demo data seeded successfully",
        "data": {
            "users": 1 + 1 + 3 + 12 + 8,  # admin + exec + managers + POs + partners
            "product_owners": 12,
            "dimensions": 8,
            "questions": 40,
            "cycles": 2,
            "assignments": 24
        },
        "demo_accounts": [
            {"email": "admin@company.com", "password": "demo123", "role": "Admin"},
            {"email": "exec@company.com", "password": "demo123", "role": "ExecViewer"},
            {"email": "james.chen@company.com", "password": "demo123", "role": "Manager - has pending assessments"},
            {"email": "alex.johnson@company.com", "password": "demo123", "role": "ProductOwner - has pending self-assessment"},
            {"email": "lisa.wang@company.com", "password": "demo123", "role": "AgileCoach - has pending coach assessments"}
        ],
        "pending_assessments": "First 3 POs have pending self-assessments, first 6 POs have pending partner/manager assessments"
    }

# Health check
@api_router.get("/")
async def root():
    return {"message": "APO Assessment API", "status": "healthy"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
