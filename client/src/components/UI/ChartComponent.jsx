// client/src/components/UI/ChartComponent.jsx
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ChartComponent = ({ data, type = 'line', options = {}, height, width }) => {
  // Default options
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: type === 'line' || type === 'bar' ? {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          borderDash: [2],
        },
      },
    } : {},
    ...options,
  };

  // Prepare data with defaults
  const chartData = data || {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        label: 'Dataset 1',
        data: [65, 59, 80, 81, 56, 55, 40],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      },
      {
        label: 'Dataset 2',
        data: [28, 48, 40, 19, 86, 27, 90],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
      },
    ],
  };

  // Render chart based on type
  const renderChart = () => {
    const style = {
      height: height || '100%',
      width: width || '100%'
    };

    switch (type.toLowerCase()) {
      case 'line':
        return <Line data={chartData} options={defaultOptions} style={style} />;
      case 'bar':
        return <Bar data={chartData} options={defaultOptions} style={style} />;
      case 'pie':
        return <Pie data={chartData} options={defaultOptions} style={style} />;
      default:
        return <Line data={chartData} options={defaultOptions} style={style} />;
    }
  };

  return (
    <div style={{ height: height || '400px', width: width || '100%' }}>
      {renderChart()}
    </div>
  );
};

export default ChartComponent;
