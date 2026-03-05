import { useState, useEffect } from 'react';
import { adminAPI, dimensionsAPI, seedDemoData } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import {
  Users,
  Settings,
  FileText,
  RefreshCw,
  Database,
  Scale,
  CheckCircle2
} from 'lucide-react';

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [dimensions, setDimensions] = useState([]);
  const [productOwners, setProductOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, dimensionsRes, posRes] = await Promise.all([
        adminAPI.getUsers(),
        dimensionsAPI.getQuestionsByDimension(),
        adminAPI.getProductOwners()
      ]);
      setUsers(usersRes.data);
      setDimensions(dimensionsRes.data);
      setProductOwners(posRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      const response = await seedDemoData();
      toast.success('Demo data seeded successfully!', {
        description: `Created ${response.data.data.product_owners} Product Owners with assessments`
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to seed demo data');
    } finally {
      setSeeding(false);
    }
  };

  const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-slate-500">Loading admin console...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-slate-900">Admin Console</h1>
            <p className="text-slate-600 mt-1">Manage questions, dimensions, and assessment settings</p>
          </div>
          <Button
            onClick={handleSeedDemo}
            disabled={seeding}
            className="bg-lime-600 hover:bg-lime-700 text-white flex items-center gap-2"
            data-testid="seed-demo-btn"
          >
            <RefreshCw className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
            {seeding ? 'Seeding...' : 'Reset & Seed Demo Data'}
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-6 kpi-tile">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-slate-600" />
              </div>
              <span className="text-sm text-slate-500">Total Users</span>
            </div>
            <div className="text-4xl font-heading font-bold text-slate-900">
              {users.length}
            </div>
          </div>

          <div className="glass-card p-6 kpi-tile">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-lime-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-lime-600" />
              </div>
              <span className="text-sm text-slate-500">Product Owners</span>
            </div>
            <div className="text-4xl font-heading font-bold text-slate-900">
              {productOwners.length}
            </div>
          </div>

          <div className="glass-card p-6 kpi-tile">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-sky-600" />
              </div>
              <span className="text-sm text-slate-500">Dimensions</span>
            </div>
            <div className="text-4xl font-heading font-bold text-slate-900">
              {dimensions.length}
            </div>
          </div>

          <div className="glass-card p-6 kpi-tile">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <Scale className="w-5 h-5 text-violet-600" />
              </div>
              <span className="text-sm text-slate-500">Total Weight</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-4xl font-heading font-bold text-slate-900">
                {totalWeight}
              </span>
              {totalWeight === 100 && <CheckCircle2 className="w-6 h-6 text-lime-600" />}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dimensions" className="space-y-6">
          <TabsList className="bg-slate-100 p-1 rounded-lg">
            <TabsTrigger value="dimensions" className="data-[state=active]:bg-white">
              Dimensions & Questions
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-white">
              Users
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-white">
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Dimensions Tab */}
          <TabsContent value="dimensions" className="space-y-6">
            {dimensions.map((dim) => (
              <div key={dim.id} className="glass-card overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-slate-900">
                        {dim.name}
                      </h3>
                      <p className="text-sm text-slate-600">{dim.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-lime-100 text-lime-700">
                        Weight: {dim.weight}%
                      </Badge>
                      <Badge variant="secondary">
                        {dim.questions?.length || 0} questions
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {dim.questions?.map((q, i) => (
                    <div key={q.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <span className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium text-slate-600">
                          {i + 1}
                        </span>
                        <div className="flex-1 space-y-2">
                          <p className="text-slate-900">{q.text_self}</p>
                          <div className="flex gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-lime-500 rounded-full" />
                              Self
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-sky-500 rounded-full" />
                              Partner
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-violet-500 rounded-full" />
                              Manager
                            </span>
                          </div>
                        </div>
                        <Badge variant={q.active ? 'default' : 'secondary'} className={q.active ? 'bg-lime-100 text-lime-700' : ''}>
                          {q.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="glass-card overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h2 className="font-heading text-lg font-semibold text-slate-900">All Users</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Name</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Email</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Role</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Team</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((user) => (
                      <tr key={user.id} className="table-row-hover">
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-900">{user.name}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{user.email}</td>
                        <td className="px-6 py-4">
                          <Badge 
                            className={
                              user.role === 'Admin' ? 'bg-violet-100 text-violet-700' :
                              user.role === 'Manager' ? 'bg-sky-100 text-sky-700' :
                              user.role === 'ProductOwner' ? 'bg-lime-100 text-lime-700' :
                              user.role === 'ExecViewer' ? 'bg-amber-100 text-amber-700' :
                              'bg-slate-100 text-slate-700'
                            }
                          >
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{user.team || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="glass-card p-6 space-y-6">
              <h2 className="font-heading text-lg font-semibold text-slate-900">Assessment Settings</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900">Anonymous Partner Feedback</h3>
                      <p className="text-sm text-slate-600">Hide partner identity from PO scorecards</p>
                    </div>
                    <Badge className="bg-lime-100 text-lime-700">Enabled</Badge>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900">Executive Comment Access</h3>
                      <p className="text-sm text-slate-600">Allow ExecViewers to see free-text comments</p>
                    </div>
                    <Badge variant="secondary">Disabled</Badge>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900">Manager Identity Visibility</h3>
                      <p className="text-sm text-slate-600">Show manager identity on PO scorecards</p>
                    </div>
                    <Badge className="bg-lime-100 text-lime-700">Enabled</Badge>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200">
                <h3 className="font-medium text-slate-900 mb-4">Growth Levels Configuration</h3>
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { band: 'Foundational', range: '0-24' },
                    { band: 'Developing', range: '25-44' },
                    { band: 'Performing', range: '45-64' },
                    { band: 'Leading', range: '65-84' },
                    { band: 'Elite', range: '85-100' }
                  ].map((item) => (
                    <div key={item.band} className="p-3 bg-slate-50 rounded-lg text-center">
                      <div className="text-sm font-medium text-slate-900">{item.band}</div>
                      <div className="text-xs text-slate-500 font-mono">{item.range}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminPage;
