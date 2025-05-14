import React from "react";
import {
  Typography,
  Box,
  Button,
  Avatar,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import MeasurementForm from "./MeasurementForm";
import MeasurementChart from "./MeasurementChart";
import DashboardSidebar from "../Dashboard/DashboardSidebar";
import useMeasurements from "../../hooks/useMeasurements";
import { Dayjs } from "dayjs";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface BodyMeasurementsProps {
  accessToken: string | null;
  onNavigate: (page: string) => void;
  themeMode: 'light' | 'dark';
  onLogout?: () => void; // Add this line if it's not already there
}

const BodyMeasurements: React.FC<BodyMeasurementsProps> = ({ 
  accessToken, 
  onNavigate, 
  themeMode 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const {
    measurements,
    logs,
    saveStatus,
    error,
    loading,
    quickEntry,
    unit,
    selectedMeasurements,
    handleInputChange,
    handleUnitChange,
    handleSave,
    handleSelectionChange,
    toggleQuickEntry,
    handleDateChange,
  } = useMeasurements(accessToken);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
        <DashboardSidebar onNavigate={onNavigate} currentPage={""} />
        
        <Box 
          className="main-container body-measurements-container" 
          sx={{ 
            flex: 1, 
            p: { xs: 1, sm: 2 },
            px: { xs: 2, sm: 3 },
            ml: { xs: 0, sm: '60px' },
            mb: { xs: '60px', sm: 0 },
            overflowY: 'auto',
            height: '100vh',
            width: { xs: '100%', sm: 'calc(100% - 60px)' },
            margin: '0 auto',
          }}
        >
          <Box 
            className="header" 
            sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between', 
              alignItems: { xs: 'flex-start', sm: 'center' },
              mb: 2,
              p: 2,
              borderRadius: 2,
              backgroundColor: 'background.paper',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
            }}
          >
            <Button
              variant="outlined"
              color="primary"
              onClick={() => onNavigate("dashboard")}
              sx={{ 
                mb: { xs: 1, sm: 0 }, 
                fontWeight: 500,
                borderRadius: 1.5,
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Back to Dashboard
            </Button>
            <Box 
              className="header-profile"
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1
              }}
            >
              <Avatar 
                alt="User" 
                src="/path-to-profile-pic.jpg" 
                sx={{ 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: '2px solid',
                  borderColor: 'primary.main'
                }} 
              />
              <Typography 
                sx={{ 
                  fontWeight: 500,
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}
              >
                User Name
              </Typography>
            </Box>
          </Box>

          <Box 
            className="card"
            sx={{ 
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              p: { xs: 1.5, sm: 3 },
              backgroundColor: 'background.paper',
              transition: 'box-shadow 0.3s ease',
              overflow: 'visible',
              height: 'auto',
              mb: 4,
              '&:hover': {
                boxShadow: '0 6px 24px rgba(0,0,0,0.12)'
              }
            }}
          >
            <Typography 
              className="card-title" 
              sx={{ 
                mb: 3, 
                fontWeight: 600, 
                fontSize: { xs: '1.2rem', sm: '1.5rem' },
                color: 'text.primary',
                borderBottom: '2px solid',
                borderColor: 'primary.main',
                paddingBottom: 1,
                width: 'fit-content'
              }}
            >
              Body Measurements
            </Typography>
            
            {loading ? (
              <Box 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                minHeight="200px"
              >
                <CircularProgress 
                  size={isMobile ? 40 : 60}
                  thickness={4}
                  sx={{ color: 'primary.main' }} 
                />
              </Box>
            ) : (
              <Box 
                sx={{ 
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  maxHeight: { xs: 'calc(100vh - 240px)', sm: 'none' }
                }}
              >
                <MeasurementForm
                  measurements={measurements}
                  quickEntry={quickEntry}
                  unit={unit}
                  handleInputChange={handleInputChange}
                  handleUnitChange={handleUnitChange}
                  toggleQuickEntry={toggleQuickEntry}
                  handleDateChange={handleDateChange}
                  handleSave={handleSave}
                  saveStatus={saveStatus}
                  error={error}
                />
                
                {logs.length > 0 && (
                  <Box sx={{ mt: 4 }}>
                    <MeasurementChart
                      logs={logs}
                      selectedMeasurements={selectedMeasurements}
                      handleSelectionChange={handleSelectionChange}
                      themeMode={themeMode}
                      unit={unit}
                    />
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default React.memo(BodyMeasurements);