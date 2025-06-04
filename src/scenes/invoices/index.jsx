import React, { useState, useEffect } from "react";
import { 
  Box, 
  Typography, 
  useTheme, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Avatar
} from "@mui/material";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

const API_BASE_URL = "http://localhost:5000/api";
const STORAGE_SERVER_URL = "http://localhost:5005/api/uploads";

const Invoices = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode) || {};
  
  // Fallback colors in case tokens are undefined
  const safeColors = {
    greenAccent: colors.greenAccent || { 200: '#4cceac', 300: '#4cceac', 500: '#4cceac' },
    blueAccent: colors.blueAccent || { 700: '#1976d2' },
    primary: colors.primary || { 400: '#ffffff' },
    yellowAccent: colors.yellowAccent || { 500: '#ffc107' }
  };
  
  // State management
  const [successStories, setSuccessStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentStory, setCurrentStory] = useState({
    id: '',
    student: '',
    age: '',
    location: '',
    timeframe: '',
    revenue: '',
    growth: '',
    video_url: '',
    thumbnail: '',
    duration: '',
    testimonial: '',
    beforeJob: '',
    afterStatus: '',
    rating: '',
    joinDate: ''
  });
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  // Fetch success stories from API
  const fetchSuccessStories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/success`);
      if (!response.ok) throw new Error('Failed to fetch success stories');
      const data = await response.json();
      setSuccessStories(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Upload file to storage server
  const uploadFile = async (file, type) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      if (type === 'video') setUploadingVideo(true);
      if (type === 'thumbnail') setUploadingThumbnail(true);

      const response = await fetch(STORAGE_SERVER_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload file');
      const data = await response.json();
      return data.url; // Assuming the server returns { url: "file_url" }
    } catch (err) {
      throw new Error(`Failed to upload ${type}: ${err.message}`);
    } finally {
      if (type === 'video') setUploadingVideo(false);
      if (type === 'thumbnail') setUploadingThumbnail(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const url = await uploadFile(file, type);
      setCurrentStory(prev => ({
        ...prev,
        [type === 'video' ? 'video_url' : 'thumbnail']: url
      }));
    } catch (err) {
      setError(err.message);
    }
  };

  // Create or update success story
  const handleSaveStory = async () => {
    try {
      const method = editMode ? 'PUT' : 'POST';
      const url = editMode 
        ? `${API_BASE_URL}/success/${currentStory.id}`
        : `${API_BASE_URL}/success`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Assuming JWT token storage
        },
        body: JSON.stringify({
          ...currentStory,
          age: parseInt(currentStory.age),
          rating: parseInt(currentStory.rating),
          id: editMode ? currentStory.id : Date.now() // Simple ID generation for new entries
        })
      });

      if (!response.ok) throw new Error('Failed to save success story');
      
      await fetchSuccessStories();
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete success story
  const handleDeleteStory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this success story?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/success/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete success story');
      
      await fetchSuccessStories();
    } catch (err) {
      setError(err.message);
    }
  };

  // Reset form
  const resetForm = () => {
    setCurrentStory({
      id: '',
      student: '',
      age: '',
      location: '',
      timeframe: '',
      revenue: '',
      growth: '',
      video_url: '',
      thumbnail: '',
      duration: '',
      testimonial: '',
      beforeJob: '',
      afterStatus: '',
      rating: '',
      joinDate: ''
    });
    setEditMode(false);
  };

  // Open dialog for new story
  const handleAddNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  // Open dialog for editing
  const handleEdit = (story) => {
    setCurrentStory(story);
    setEditMode(true);
    setDialogOpen(true);
  };

  // DataGrid columns
  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    {
      field: "student",
      headerName: "Student Name",
      flex: 1,
      cellClassName: "name-column--cell",
    },
    {
      field: "age",
      headerName: "Age",
      width: 80,
    },
    {
      field: "location",
      headerName: "Location",
      flex: 1,
    },
    {
      field: "revenue",
      headerName: "Revenue",
      flex: 1,
      renderCell: (params) => (
        <Typography color={safeColors.greenAccent[500]}>
          {params.row.revenue}
        </Typography>
      ),
    },
    {
      field: "growth",
      headerName: "Growth",
      flex: 1,
      renderCell: (params) => (
        <Chip 
          label={params.row.growth} 
          color="success" 
          size="small"
        />
      ),
    },
    {
      field: "rating",
      headerName: "Rating",
      width: 100,
      renderCell: (params) => (
        <Box display="flex" alignItems="center">
          <Typography>{params.row.rating}</Typography>
          <Typography color={safeColors.yellowAccent[500]}>★</Typography>
        </Box>
      ),
    },
    {
      field: "thumbnail",
      headerName: "Thumbnail",
      width: 100,
      renderCell: (params) => (
        params.row.thumbnail ? (
          <Avatar 
            src={params.row.thumbnail} 
            sx={{ width: 40, height: 40 }}
          />
        ) : null
      ),
    },
    {
      field: "video_url",
      headerName: "Video",
      width: 80,
      renderCell: (params) => (
        params.row.video_url ? (
          <PlayArrowIcon 
            color="primary" 
            sx={{ cursor: 'pointer' }}
            onClick={() => window.open(params.row.video_url, '_blank')}
          />
        ) : null
      ),
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit"
          onClick={() => handleEdit(params.row)}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleDeleteStory(params.row.id)}
        />,
      ],
    },
  ];

  // Load data on component mount
  useEffect(() => {
    fetchSuccessStories();
  }, []);

  if (loading) {
    return (
      <Box m="20px" display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Header title="SUCCESS STORIES" subtitle="Student Success Stories Management" />
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box mb={2}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddNew}
          sx={{ backgroundColor: safeColors.blueAccent[700] }}
        >
          Add New Success Story
        </Button>
      </Box>

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
            color: safeColors.greenAccent[300],
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: safeColors.blueAccent[700],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: safeColors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: safeColors.blueAccent[700],
          },
          "& .MuiCheckbox-root": {
            color: `${safeColors.greenAccent[200]} !important`,
          },
        }}
      >
        <DataGrid 
          checkboxSelection 
          rows={successStories} 
          columns={columns}
          getRowId={(row) => row.id}
        />
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Success Story' : 'Add New Success Story'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Student Name"
                value={currentStory.student}
                onChange={(e) => setCurrentStory(prev => ({ ...prev, student: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Age"
                type="number"
                value={currentStory.age}
                onChange={(e) => setCurrentStory(prev => ({ ...prev, age: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={currentStory.location}
                onChange={(e) => setCurrentStory(prev => ({ ...prev, location: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Timeframe"
                value={currentStory.timeframe}
                onChange={(e) => setCurrentStory(prev => ({ ...prev, timeframe: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Revenue"
                value={currentStory.revenue}
                onChange={(e) => setCurrentStory(prev => ({ ...prev, revenue: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Growth"
                value={currentStory.growth}
                onChange={(e) => setCurrentStory(prev => ({ ...prev, growth: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duration"
                value={currentStory.duration}
                onChange={(e) => setCurrentStory(prev => ({ ...prev, duration: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Rating"
                type="number"
                inputProps={{ min: 1, max: 5 }}
                value={currentStory.rating}
                onChange={(e) => setCurrentStory(prev => ({ ...prev, rating: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Before Job"
                value={currentStory.beforeJob}
                onChange={(e) => setCurrentStory(prev => ({ ...prev, beforeJob: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="After Status"
                value={currentStory.afterStatus}
                onChange={(e) => setCurrentStory(prev => ({ ...prev, afterStatus: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Join Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={currentStory.joinDate}
                onChange={(e) => setCurrentStory(prev => ({ ...prev, joinDate: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Testimonial"
                value={currentStory.testimonial}
                onChange={(e) => setCurrentStory(prev => ({ ...prev, testimonial: e.target.value }))}
              />
            </Grid>
            
            {/* File Upload Sections */}
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="subtitle1" gutterBottom>Video Upload</Typography>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={uploadingVideo ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                  disabled={uploadingVideo}
                  fullWidth
                >
                  {uploadingVideo ? 'Uploading...' : 'Upload Video'}
                  <input
                    type="file"
                    hidden
                    accept="video/*"
                    onChange={(e) => handleFileUpload(e, 'video')}
                  />
                </Button>
                {currentStory.video_url && (
                  <Typography variant="caption" color="success.main">
                    Video uploaded successfully
                  </Typography>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="subtitle1" gutterBottom>Thumbnail Upload</Typography>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={uploadingThumbnail ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                  disabled={uploadingThumbnail}
                  fullWidth
                >
                  {uploadingThumbnail ? 'Uploading...' : 'Upload Thumbnail'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'thumbnail')}
                  />
                </Button>
                {currentStory.thumbnail && (
                  <Box mt={1}>
                    <Avatar 
                      src={currentStory.thumbnail} 
                      sx={{ width: 60, height: 60 }}
                    />
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveStory}
            variant="contained"
            disabled={!currentStory.student || !currentStory.age}
          >
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Invoices;