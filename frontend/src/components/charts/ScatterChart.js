import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

const ScatterChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        No data available
      </div>
    );
  }

  const chartData = {
    datasets: [
      {
        label: 'Product Owners',
        data: data.map(d => ({
          x: d.self,
          y: d.partner,
          name: d.name,
          manager: d.manager
        })),
        backgroundColor: 'rgba(132, 204, 22, 0.7)',
        borderColor: 'rgba(77, 124, 15, 1)',
        borderWidth: 2,
        pointRadius: 8,
        pointHoverRadius: 10
      },
      {
        label: 'Perfect Alignment',
        data: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
        type: 'line',
        borderColor: 'rgba(148, 163, 184, 0.5)',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Self Score',
          font: {
            family: "'Plus Jakarta Sans', sans-serif",
            size: 12,
            weight: '500'
          },
          color: '#64748b'
        },
        min: 0,
        max: 100,
        ticks: {
          font: {
            family: "'Plus Jakarta Sans', sans-serif",
            size: 10
          },
          color: '#64748b'
        },
        grid: {
          color: '#e2e8f0'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Partner Avg Score',
          font: {
            family: "'Plus Jakarta Sans', sans-serif",
            size: 12,
            weight: '500'
          },
          color: '#64748b'
        },
        min: 0,
        max: 100,
        ticks: {
          font: {
            family: "'Plus Jakarta Sans', sans-serif",
            size: 10
          },
          color: '#64748b'
        },
        grid: {
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
          title: function(context) {
            const point = context[0]?.raw;
            return point?.name || '';
          },
          label: function(context) {
            const point = context.raw;
            if (!point.name) return null;
            return [
              `Self: ${point.x?.toFixed(1) || '—'}`,
              `Partner: ${point.y?.toFixed(1) || '—'}`,
              `Manager: ${point.manager?.toFixed(1) || '—'}`
            ];
          }
        }
      }
    }
  };

  return (
    <div className="chart-container" data-testid="scatter-chart">
      <Scatter data={chartData} options={options} />
    </div>
  );
};

export default ScatterChart;
