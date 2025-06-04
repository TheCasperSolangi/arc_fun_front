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
  Avatar,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from "@mui/material";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import VisibilityIcon from "@mui/icons-material/Visibility";

const API_BASE_URL = "https://api.arcdatum.com/api";
const STORAGE_SERVER_URL = "https://ftp.arcdatum.com/api/uploads";

const Videos = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode) || {};
  
  // Fallback colors in case tokens are undefined
  const safeColors = {
    greenAccent: colors.greenAccent || { 200: '#4cceac', 300: '#4cceac', 500: '#4cceac' },
    blueAccent: colors.blueAccent || { 700: '#1976d2' },
    primary: colors.primary || { 400: '#ffffff' },
    yellowAccent: colors.yellowAccent || { 500: '#ffc107' }
  };
  
  // Video categories
  const videoCategories = [
    'Tutorial',
    'Course',
    'Webinar',
    'Demo',
    'Review',
    'Introduction',
    'Advanced',
    'Beginner'
  ];
  
  // State management
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentVideo, setCurrentVideo] = useState({
    id: '',
    title: '',
    thumbnail: '',
    category: '',
    views: 0,
    video_url: ''
  });
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  // Fetch videos from API
  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/videos`);
      if (!response.ok) throw new Error('Failed to fetch videos');
      const data = await response.json();
      setVideos(data);
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
      setCurrentVideo(prev => ({
        ...prev,
        [type === 'video' ? 'video_url' : 'thumbnail']: url
      }));
    } catch (err) {
      setError(err.message);
    }
  };

  // Generate unique video ID
  const generateVideoId = () => {
    return `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Create or update video
  const handleSaveVideo = async () => {
    try {
      const method = editMode ? 'PUT' : 'POST';
      const url = editMode 
        ? `${API_BASE_URL}/videos/${currentVideo.id}`
        : `${API_BASE_URL}/videos`;

      const videoData = {
        ...currentVideo,
        views: parseInt(currentVideo.views) || 0,
        id: editMode ? currentVideo.id : generateVideoId()
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Assuming JWT token storage
        },
        body: JSON.stringify(videoData)
      });

      if (!response.ok) throw new Error('Failed to save video');
      
      await fetchVideos();
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete video
  const handleDeleteVideo = async (id) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/videos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete video');
      
      await fetchVideos();
    } catch (err) {
      setError(err.message);
    }
  };

  // Reset form
  const resetForm = () => {
    setCurrentVideo({
      id: '',
      title: '',
      thumbnail: '',
      category: '',
      views: 0,
      video_url: ''
    });
    setEditMode(false);
  };

  // Open dialog for new video
  const handleAddNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  // Open dialog for editing
  const handleEdit = (video) => {
    setCurrentVideo(video);
    setEditMode(true);
    setDialogOpen(true);
  };

  // Format number with commas
  const formatViews = (views) => {
    return new Intl.NumberFormat().format(views);
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      'Tutorial': 'primary',
      'Course': 'secondary',
      'Webinar': 'success',
      'Demo': 'info',
      'Review': 'warning',
      'Introduction': 'error',
      'Advanced': 'default',
      'Beginner': 'success'
    };
    return colors[category] || 'default';
  };

  // DataGrid columns
  const columns = [
    { field: "id", headerName: "ID", width: 150 },
    {
      field: "title",
      headerName: "Title",
      flex: 2,
      cellClassName: "name-column--cell",
    },
    {
      field: "category",
      headerName: "Category",
      flex: 1,
      renderCell: (params) => (
        <Chip 
          label={params.row.category} 
          color={getCategoryColor(params.row.category)}
          size="small"
        />
      ),
    },
    {
      field: "views",
      headerName: "Views",
      flex: 1,
      renderCell: (params) => (
        <Box display="flex" alignItems="center">
          <VisibilityIcon sx={{ mr: 1, fontSize: 16 }} />
          <Typography color={safeColors.greenAccent[500]}>
            {formatViews(params.row.views)}
          </Typography>
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
            variant="rounded"
          />
        ) : (
          <Avatar 
            sx={{ width: 40, height: 40, bgcolor: 'grey.300' }}
            variant="rounded"
          >
            📹
          </Avatar>
        )
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
            sx={{ cursor: 'pointer', fontSize: 32 }}
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
          onClick={() => handleDeleteVideo(params.row.id)}
        />,
      ],
    },
  ];

  // Load data on component mount
  useEffect(() => {
    fetchVideos();
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
      <Header title="VIDEOS" subtitle="Video Content Management" />
      
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
          Add New Video
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
          rows={videos} 
          columns={columns}
          getRowId={(row) => row.id}
        />
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Video' : 'Add New Video'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Video Title"
                value={currentVideo.title}
                onChange={(e) => setCurrentVideo(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={currentVideo.category}
                  label="Category"
                  onChange={(e) => setCurrentVideo(prev => ({ ...prev, category: e.target.value }))}
                  required
                >
                  {videoCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Views"
                type="number"
                value={currentVideo.views}
                onChange={(e) => setCurrentVideo(prev => ({ ...prev, views: e.target.value }))}
                inputProps={{ min: 0 }}
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
                {currentVideo.video_url && (
                  <Typography variant="caption" color="success.main" display="block" mt={1}>
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
                {currentVideo.thumbnail && (
                  <Box mt={1}>
                    <Avatar 
                      src={currentVideo.thumbnail} 
                      sx={{ width: 80, height: 60 }}
                      variant="rounded"
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
            onClick={handleSaveVideo}
            variant="contained"
            disabled={!currentVideo.title || !currentVideo.category || !currentVideo.video_url}
          >
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Videos;