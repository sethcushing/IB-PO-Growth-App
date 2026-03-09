import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const RadarChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        No data available
      </div>
    );
  }

  const chartData = {
    labels: data.map(d => d.dimension),
    datasets: [
      {
        label: 'Self',
        data: data.map(d => d.self),
        backgroundColor: 'rgba(132, 204, 22, 0.2)',
        borderColor: 'rgba(132, 204, 22, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(132, 204, 22, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(132, 204, 22, 1)'
      },
      {
        label: 'Coach',
        data: data.map(d => d.partner),
        backgroundColor: 'rgba(14, 165, 233, 0.2)',
        borderColor: 'rgba(14, 165, 233, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(14, 165, 233, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(14, 165, 233, 1)'
      },
      {
        label: 'Manager',
        data: data.map(d => d.manager),
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(139, 92, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(139, 92, 246, 1)'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 100,
        beginAtZero: true,
        ticks: {
          stepSize: 20,
          font: {
            family: "'Plus Jakarta Sans', sans-serif",
            size: 10
          },
          color: '#64748b'
        },
        pointLabels: {
          font: {
            family: "'Plus Jakarta Sans', sans-serif",
            size: 11,
            weight: '500'
          },
          color: '#334155'
        },
        grid: {
          color: '#e2e8f0'
        },
        angleLines: {
          color: '#e2e8f0'
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: {
          family: "'Plus Jakarta Sans', sans-serif",
          size: 12
        },
        bodyFont: {
          family: "'Plus Jakarta Sans', sans-serif",
          size: 11
        },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw?.toFixed(1) || 0}`;
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0.1
      }
    }
  };

  return (
    <div className="chart-container" data-testid="radar-chart">
      <Radar data={chartData} options={options} />
    </div>
  );
};

export default RadarChart;
