import { Box, Button, Modal, TextField, Typography, useTheme, CircularProgress, Alert } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { useState, useEffect } from "react";
import axios from "axios";

const Contacts = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [newTestimonial, setNewTestimonial] = useState({
    student: "",
    age: "",
    location: "",
    timeframe: "",
    revenue: "",
    growth: "",
    video_url: "",
    thumbnail: "",
    duration: "",
    testimonial: "",
    beforeJob: "",
    afterStatus: "",
    rating: 0,
    joinDate: ""
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/testimonials');
      setTestimonials(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setUploadError("");
    setSelectedVideo(null);
  };
  
  const handleClose = () => {
    setOpen(false);
    setUploadError("");
    setSelectedVideo(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewTestimonial(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'];
      if (!allowedTypes.includes(file.type)) {
        setUploadError("Please select a valid video file (MP4, WebM, OGG, AVI, MOV)");
        return;
      }
      
      // Validate file size (e.g., max 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB in bytes
      if (file.size > maxSize) {
        setUploadError("Video file size must be less than 100MB");
        return;
      }
      
      setSelectedVideo(file);
      setUploadError("");
    }
  };

  const uploadVideo = async () => {
    if (!selectedVideo) {
      setUploadError("Please select a video file first");
      return null;
    }

    setUploadLoading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append('file', selectedVideo);
      
      // Generate a unique key for the file
      const timestamp = Date.now();
      const fileName = selectedVideo.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileKey = `testimonials/${timestamp}_${fileName}`;
      formData.append('key', fileKey);

      // Upload to your storage server
      const response = await axios.post('http://localhost:5005/api/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload Progress: ${percentCompleted}%`);
        },
      });

      setUploadLoading(false);
      return response.data.url; // Assuming the server returns { url: "https://..." }
      
    } catch (error) {
      console.error("Error uploading video:", error);
      setUploadError(error.response?.data?.message || "Failed to upload video. Please try again.");
      setUploadLoading(false);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let videoUrl = newTestimonial.video_url;
      
      // If a video file is selected, upload it first
      if (selectedVideo) {
        videoUrl = await uploadVideo();
        if (!videoUrl) {
          return; // Upload failed, don't proceed
        }
      }

      // Auto-generate ID (you might want a better ID generation in production)
      const newId = testimonials.length > 0 
        ? Math.max(...testimonials.map(t => t.id)) + 1 
        : 1;
      
      const testimonialToSubmit = {
        ...newTestimonial,
        id: newId,
        age: Number(newTestimonial.age),
        rating: Number(newTestimonial.rating),
        video_url: videoUrl
      };

      await axios.post('http://localhost:5000/api/testimonials', testimonialToSubmit);
      fetchTestimonials(); // Refresh the list
      handleClose(); // Close modal
      setNewTestimonial({ // Reset form
        student: "",
        age: "",
        location: "",
        timeframe: "",
        revenue: "",
        growth: "",
        video_url: "",
        thumbnail: "",
        duration: "",
        testimonial: "",
        beforeJob: "",
        afterStatus: "",
        rating: 0,
        joinDate: ""
      });
    } catch (error) {
      console.error("Error adding testimonial:", error);
      setUploadError("Failed to save testimonial. Please try again.");
    }
  };

  const columns = [
    { field: "id", headerName: "ID", flex: 0.5 },
    { 
      field: "student", 
      headerName: "Student Name", 
      flex: 1,
      cellClassName: "name-column--cell",
    },
    {
      field: "age",
      headerName: "Age",
      type: "number",
      headerAlign: "left",
      align: "left",
    },
    {
      field: "location",
      headerName: "Location",
      flex: 1,
    },
    {
      field: "beforeJob",
      headerName: "Previous Job",
      flex: 1,
    },
    {
      field: "afterStatus",
      headerName: "Current Status",
      flex: 1,
    },
    {
      field: "joinDate",
      headerName: "Join Date",
      flex: 1,
    },
    {
      field: "rating",
      headerName: "Rating",
      type: "number",
      flex: 0.5,
    },
    {
      field: "video_url",
      headerName: "Video",
      flex: 1,
      renderCell: (params) => (
        <a href={params.value} target="_blank" rel="noopener noreferrer">
          View Video
        </a>
      ),
    },
  ];

  return (
    <Box m="20px">
      <Header
        title="TESTIMONIALS"
        subtitle="List of Student Success Stories"
      />
      
      <Button 
        variant="contained" 
        color="secondary" 
        onClick={handleOpen}
        sx={{ mb: 2 }}
      >
        Add New Testimonial
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          maxHeight: '80vh',
          overflowY: 'auto'
        }}>
          <Typography id="modal-modal-title" variant="h6" component="h2" mb={2}>
            Add New Testimonial
          </Typography>
          
          {uploadError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {uploadError}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Student Name"
              name="student"
              value={newTestimonial.student}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Age"
              name="age"
              type="number"
              value={newTestimonial.age}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Location"
              name="location"
              value={newTestimonial.location}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Previous Job"
              name="beforeJob"
              value={newTestimonial.beforeJob}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Current Status"
              name="afterStatus"
              value={newTestimonial.afterStatus}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Join Date"
              name="joinDate"
              value={newTestimonial.joinDate}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Rating (1-5)"
              name="rating"
              type="number"
              inputProps={{ min: 1, max: 5 }}
              value={newTestimonial.rating}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Timeframe"
              name="timeframe"
              value={newTestimonial.timeframe}
              onChange={handleChange}
              margin="normal"
              placeholder="e.g., 6 months, 1 year"
              required
            />
            <TextField
              fullWidth
              label="Revenue"
              name="revenue"
              value={newTestimonial.revenue}
              onChange={handleChange}
              margin="normal"
              placeholder="e.g., $10,000/month"
            />
            <TextField
              fullWidth
              label="Growth"
              name="growth"
              value={newTestimonial.growth}
              onChange={handleChange}
              margin="normal"
              placeholder="e.g., 200% increase"
            />
            <TextField
              fullWidth
              label="Thumbnail URL"
              name="thumbnail"
              value={newTestimonial.thumbnail}
              onChange={handleChange}
              margin="normal"
              placeholder="URL for video thumbnail image"
              required
            />
            <TextField
              fullWidth
              label="Duration"
              name="duration"
              value={newTestimonial.duration}
              onChange={handleChange}
              margin="normal"
              placeholder="e.g., 2:30"
            />
            
            {/* Video Upload Section */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Upload Video File
              </Typography>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                style={{ marginBottom: '10px' }}
              />
              {selectedVideo && (
                <Typography variant="caption" display="block" sx={{ color: 'success.main' }}>
                  Selected: {selectedVideo.name} ({(selectedVideo.size / (1024 * 1024)).toFixed(2)} MB)
                </Typography>
              )}
            </Box>
            
            {/* Alternative Video URL Input */}
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              OR Enter Video URL
            </Typography>
            <TextField
              fullWidth
              label="Video URL"
              name="video_url"
              value={newTestimonial.video_url}
              onChange={handleChange}
              margin="normal"
              disabled={selectedVideo !== null}
              helperText={selectedVideo ? "Video file selected. URL field is disabled." : "Enter video URL if not uploading a file"}
            />
            
            <TextField
              fullWidth
              label="Testimonial Text"
              name="testimonial"
              value={newTestimonial.testimonial}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={4}
              required
            />
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <Button onClick={handleClose} sx={{ mr: 1 }} disabled={uploadLoading}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="secondary"
                disabled={uploadLoading || (!selectedVideo && !newTestimonial.video_url)}
                startIcon={uploadLoading ? <CircularProgress size={20} /> : null}
              >
                {uploadLoading ? 'Uploading...' : 'Submit'}
              </Button>
            </Box>
          </form>
        </Box>
      </Modal>

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
          "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
            color: `${colors.grey[100]} !important`,
          },
        }}
      >
        <DataGrid
          rows={testimonials}
          columns={columns}
          loading={loading}
          components={{ Toolbar: GridToolbar }}
        />
      </Box>
    </Box>
  );
};

export default Contacts;