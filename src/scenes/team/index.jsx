import { Box, Typography, useTheme, Modal, IconButton } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import { useEffect, useState } from "react";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import Header from "../../components/Header";
import CloseIcon from "@mui/icons-material/Close";

const Team = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState("");

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const response = await fetch('https://api.arcdatum.com/api/responses', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch responses');
        const data = await response.json();
        setResponses(data);
      } catch (error) {
        console.error('Error fetching responses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();
  }, []);

  const handleQueryClick = (query) => {
    setSelectedQuery(query);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedQuery("");
  };

  const columns = [
    { field: "id", headerName: "ID" },
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      cellClassName: "name-column--cell",
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
    },
    {
      field: "phoneNumber",
      headerName: "Phone Number",
      flex: 1,
    },
    {
      field: "selectedCourse",
      headerName: "Selected Course",
      flex: 1,
    },
    {
      field: "query",
      headerName: "Query",
      flex: 1,
      renderCell: (params) => (
        <Box
          onClick={() => handleQueryClick(params.row.query)}
          sx={{
            cursor: "pointer",
            "&:hover": {
              textDecoration: "underline",
              color: colors.greenAccent[300],
            },
          }}
        >
          {params.row.query.length > 50
            ? `${params.row.query.substring(0, 50)}...`
            : params.row.query}
        </Box>
      ),
    },
    {
      field: "prefered_call_time",
      headerName: "Preferred Call Time",
      flex: 1,
    },
    {
      field: "accessLevel",
      headerName: "Status",
      flex: 1,
      renderCell: ({ row }) => {
        const status = row.status || "new";
        return (
          <Box
            width="60%"
            m="0 auto"
            p="5px"
            display="flex"
            justifyContent="center"
            backgroundColor={
              status === "contacted"
                ? colors.greenAccent[600]
                : status === "pending"
                ? colors.greenAccent[700]
                : colors.greenAccent[800]
            }
            borderRadius="4px"
          >
            {status === "contacted" && <AdminPanelSettingsOutlinedIcon />}
            {status === "pending" && <SecurityOutlinedIcon />}
            {status === "new" && <LockOpenOutlinedIcon />}
            <Typography color={colors.grey[100]} sx={{ ml: "5px" }}>
              {status}
            </Typography>
          </Box>
        );
      },
    },
  ];

  return (
    <Box m="20px">
      <Header title="RESPONSES" subtitle="Managing Student Responses" />
      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
          },
          "& .name-column--cell": {
            color: colors.greenAccent[300],
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700],
          },
          "& .MuiCheckbox-root": {
            color: `${colors.greenAccent[200]} !important`,
          },
        }}
      >
        <DataGrid 
          checkboxSelection 
          rows={responses} 
          columns={columns} 
          loading={loading}
        />
      </Box>

      {/* Query Detail Modal */}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="query-detail-modal"
        aria-describedby="query-detail-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "60%",
            bgcolor: colors.primary[400],
            boxShadow: 24,
            p: 4,
            borderRadius: "4px",
            outline: "none",
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography
              id="query-detail-modal"
              variant="h5"
              color={colors.grey[100]}
            >
              Query Details
            </Typography>
            <IconButton onClick={handleCloseModal}>
              <CloseIcon sx={{ color: colors.grey[100] }} />
            </IconButton>
          </Box>
          <Box
            id="query-detail-modal-description"
            sx={{
              mt: 2,
              p: 2,
              bgcolor: colors.primary[600],
              borderRadius: "4px",
              minHeight: "200px",
              overflowY: "auto",
            }}
          >
            <Typography color={colors.grey[100]}>{selectedQuery}</Typography>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default Team;