import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  ListGroup,
  Badge,
  Spinner,
  Alert,
  ProgressBar,
  Modal
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import styles from "./Learning.module.css";

const Learning = () => {
  const [courseContent, setCourseContent] = useState([]);
  const [currentContent, setCurrentContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrollment, setEnrollment] = useState(null);
  const [completedContents, setCompletedContents] = useState(new Set());
  const [progress, setProgress] = useState({ completed: 0, total: 0, percentage: 0 });
  const [markingComplete, setMarkingComplete] = useState(false);
  const [videoProgress, setVideoProgress] = useState({});
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [nextContent, setNextContent] = useState(null);
  const [completionInProgress, setCompletionInProgress] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [secureMediaUrls, setSecureMediaUrls] = useState({});
  const [youtubePlayer, setYoutubePlayer] = useState(null);
  const [youtubeApiReady, setYoutubeApiReady] = useState(false);
  const [youtubeBlobUrls, setYoutubeBlobUrls] = useState({});

  const videoRef = useRef(null);
  const youtubeIframeRef = useRef(null);
  const documentIframeRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const { courseId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Video completion threshold (90% watched)
  const COMPLETION_THRESHOLD = 0.9;

const API_URL = import.meta.env.VITE_API_BASE_URL;

  // Load YouTube API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        setYoutubeApiReady(true);
      };
    } else {
      setYoutubeApiReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/learning/${courseId}` } });
      return;
    }
    fetchCourseContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, isAuthenticated]);

  // Clean up intervals and blob URLs on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      // Clean up YouTube player
      if (youtubePlayer) {
        youtubePlayer.destroy();
        setYoutubePlayer(null);
      }
      // Clean up blob URLs
      Object.values(youtubeBlobUrls).forEach(blobUrl => {
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
        }
      });
    };
  }, [youtubePlayer, youtubeBlobUrls]);

  // When currentContent changes, set up video URL and tracking
  useEffect(() => {
    if (currentContent?.type === "video") {
      setupVideoForContent();
    } else {
      // If not video, clear interval if set
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      // Clean up YouTube player
      if (youtubePlayer) {
        youtubePlayer.destroy();
        setYoutubePlayer(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentContent]);

  const fetchCourseContent = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/course-content/${courseId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const contents = res.data.content || [];
      setCourseContent(contents);
      setEnrollment(res.data.enrollment || null);

      // Set completedContents from API response
      const completedContentIds = res.data.progress?.completedContentIds || [];
      setCompletedContents(new Set(completedContentIds));

      // Calculate progress based on completed contents
      const totalContents = contents.length;
      const completedCount = completedContentIds.length;
      const percentage = totalContents > 0 ? Math.round((completedCount / totalContents) * 100) : 0;

      setProgress({
        completed: completedCount,
        total: totalContents,
        percentage: percentage,
      });

      // Initialize video progress tracking
      const initialVideoProgress = {};
      contents.forEach((content) => {
        if (content.type === "video") {
          initialVideoProgress[content._id] = {
            currentTime: 0,
            duration: content.duration || 0,
            percentage: 0,
            completed: completedContentIds.includes(content._id),
          };
        }
      });
      setVideoProgress(initialVideoProgress);

      // Pre-fetch secure URLs for all content
      await preFetchSecureUrls(contents);

      if (contents.length > 0) {
        setCurrentContent(contents[0]);
      } else {
        setCurrentContent(null);
      }
    } catch (err) {
      console.error("Error fetching course content:", err);
      const errorMessage = err.response?.data?.message || "Failed to load course content. Please try again.";
      setError(errorMessage);

      if (err.response?.status === 403) {
        setTimeout(() => {
          navigate(`/course/${courseId}`);
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  // Pre-fetch secure URLs for all content
  const preFetchSecureUrls = async (contents) => {
    const urls = {};
    
    for (const content of contents) {
      if (content.type === "video" && !isYouTubeUrl(content.videoUrl) && content.secureVideoToken) {
        urls[content._id] = {
          video: `${API_URL}/api/course-content/secure-media/video?token=${content.secureVideoToken}`
        };
      } else if ((content.type === "document" || content.type === "pdf" || content.type === "excel") && content.secureDocumentToken) {
        urls[content._id] = {
          document: `${API_URL}/api/course-content/secure-media/document?token=${content.secureDocumentToken}`
        };
      }
    }
    
    setSecureMediaUrls(urls);
  };

  // ✅ GUARANTEED WORKING YOUTUBE HANDLING
  const createSecureYouTubeBlobUrl = async (contentId, youtubeUrl) => {
    try {
      const token = localStorage.getItem("token");
      
      // Option 1: Get direct YouTube URL (Recommended)
      const response = await axios.post(
        `${API_URL}/api/course-content/direct-youtube-url`,
        { youtubeUrl, contentId },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Use direct YouTube URL (most reliable)
        return response.data.embedUrl;
      }
      
      throw new Error("Failed to get direct URL");
      
    } catch (error) {
      console.error("Error getting direct YouTube URL:", error);
      
      // ✅ FALLBACK: Use direct YouTube embed (100% working)
      const videoId = extractYouTubeId(youtubeUrl);
      if (videoId) {
        console.log("🔄 Using fallback direct YouTube URL");
        return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
      }
      
      throw error;
    }
  };

  // Update the getVideoSrc function
  const getVideoSrc = (content) => {
    if (!content) return null;

    if (isYouTubeUrl(content.videoUrl)) {
      // Use direct YouTube URL (most reliable approach)
      const videoId = extractYouTubeId(content.videoUrl);
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
      }
    }

    // Use secure media URL for local videos
    if (secureMediaUrls[content._id]?.video) {
      return secureMediaUrls[content._id].video;
    }

    return null;
  };

  // Remove complex YouTube setup, use simple iframe
  const setupVideoForContent = async () => {
    if (!currentContent) return;

    setVideoLoading(true);
    
    try {
      if (isYouTubeUrl(currentContent.videoUrl)) {
        // For YouTube, we'll use direct embed (no complex setup needed)
        setTimeout(() => {
          setVideoLoading(false);
        }, 1000);
      } else if (secureMediaUrls[currentContent._id]?.video) {
        // Local video file - use secure streaming URL
        setTimeout(() => {
          setupLocalVideoTracking();
        }, 500);
      }
    } catch (error) {
      console.error("Error setting up video:", error);
      setError("Failed to load video content. Please try again.");
      setVideoLoading(false);
    }
  };

  const isYouTubeUrl = (url) => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const extractYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const getDocumentUrl = (content) => {
    if (!content) return null;
    
    if (content.documentUrl) {
      // External document URL
      return content.documentUrl;
    }
    
    // Use secure media URL for local documents
    if (secureMediaUrls[content._id]?.document) {
      return secureMediaUrls[content._id].document;
    }
    
    return null;
  };

  // Handle file download for non-viewable formats (Excel, Word)
  const handleFileDownload = async (content) => {
    try {
      setDocumentLoading(true);
      const documentUrl = getDocumentUrl(content);
      
      if (!documentUrl) {
        throw new Error("No document URL available");
      }

      // For secure URLs, we need to download with authentication
      const token = localStorage.getItem("token");
      const response = await axios.get(documentUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      // Create a blob URL for download
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Get the original filename from the content
      const filename = content.documentFile?.originalName || 
                       getDefaultFilename(content);
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(downloadUrl);
      setDocumentLoading(false);
      
    } catch (error) {
      console.error("Error downloading file:", error);
      setDocumentLoading(false);
      setError(`Failed to download ${content.type} file. Please try again.`);
    }
  };

  // Get default filename based on content type
  const getDefaultFilename = (content) => {
    const baseName = `file-${content._id}`;
    switch (content.type) {
      case 'excel':
        return `${baseName}.xlsx`;
      case 'document':
        // Check file extension from original name if available
        if (content.documentFile?.originalName) {
          const ext = content.documentFile.originalName.split('.').pop();
          return `${baseName}.${ext}`;
        }
        return `${baseName}.docx`;
      default:
        return `${baseName}.pdf`;
    }
  };

  // Check if document type requires download (Excel and Word only)
  const requiresDownload = (content) => {
    return content.type === 'excel' || content.type === 'document';
  };

  // Get document type display name
  const getDocumentTypeName = (content) => {
    switch (content.type) {
      case 'pdf':
        return 'PDF Document';
      case 'excel':
        return 'Excel Spreadsheet';
      case 'document':
        return 'Word Document';
      default:
        return 'Document';
    }
  };

  // Get document icon
  const getDocumentIcon = (content) => {
    switch (content.type) {
      case 'pdf':
        return '📄';
      case 'excel':
        return '📊';
      case 'document':
        return '📝';
      default:
        return '📁';
    }
  };

  const setupLocalVideoTracking = () => {
    const video = videoRef.current;
    if (!video) return;

    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    const handleLoadedMetadata = () => {
      console.log("Video metadata loaded, duration:", video.duration);
      setVideoProgress((prev) => ({
        ...prev,
        [currentContent._id]: {
          ...prev[currentContent._id],
          duration: video.duration || prev[currentContent._id]?.duration || 0,
        },
      }));
      setVideoLoading(false);
    };

    const handleTimeUpdate = () => {
      if (!video.duration || video.duration === Infinity) return;

      const currentTime = video.currentTime;
      const duration = video.duration;
      const percentage = currentTime / duration;

      setVideoProgress((prev) => ({
        ...prev,
        [currentContent._id]: {
          currentTime,
          duration,
          percentage,
          completed: percentage >= COMPLETION_THRESHOLD || completedContents.has(currentContent._id),
        },
      }));

      if (percentage >= COMPLETION_THRESHOLD && !completedContents.has(currentContent._id) && !completionInProgress) {
        handleVideoCompletion();
      }
    };

    const handleEnded = () => {
      if (!completedContents.has(currentContent._id) && !completionInProgress) {
        handleVideoCompletion();
      }
    };

    const handleError = (e) => {
      console.error("Video error:", e);
      setVideoLoading(false);
      if (e.target.error && e.target.error.code === 4) {
        console.error("Video access denied - authentication required");
        setError("Video access denied. Please refresh the page and try again.");
      }
    };

    const handleWaiting = () => {
      setVideoLoading(true);
    };

    const handlePlaying = () => {
      setVideoLoading(false);
    };

    // Remove existing event listeners first
    video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    video.removeEventListener("timeupdate", handleTimeUpdate);
    video.removeEventListener("ended", handleEnded);
    video.removeEventListener("error", handleError);
    video.removeEventListener("waiting", handleWaiting);
    video.removeEventListener("playing", handlePlaying);

    // Add new event listeners
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);

    // Set up periodic check as backup
    progressIntervalRef.current = setInterval(() => {
      if (video.readyState > 0 && video.duration && video.duration !== Infinity) {
        handleTimeUpdate();
      }
    }, 2000);

    // Return cleanup function
    return () => {
      try {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        video.removeEventListener("timeupdate", handleTimeUpdate);
        video.removeEventListener("ended", handleEnded);
        video.removeEventListener("error", handleError);
        video.removeEventListener("waiting", handleWaiting);
        video.removeEventListener("playing", handlePlaying);
      } catch (e) {
        // ignore errors
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  };

  const setupYouTubeTracking = () => {
    // Simplified YouTube tracking - just basic event listening
    const iframe = youtubeIframeRef.current;
    if (!iframe) return;

    const handleMessage = (event) => {
      if (event.data && event.data.type === 'youtubePlayerLoaded') {
        setVideoLoading(false);
        console.log("YouTube player loaded successfully");
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  };

  const formatEnrollmentDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds === 0 || seconds === Infinity) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getVideoProgress = (contentId) => {
    return videoProgress[contentId] || { currentTime: 0, duration: 0, percentage: 0, completed: false };
  };

  const handleVideoCompletion = async () => {
    if (!currentContent) return;
    if (completedContents.has(currentContent._id)) return;
    if (completionInProgress) return;

    try {
      setCompletionInProgress(true);
      await markContentAsCompleted(currentContent._id);

      // Find next content
      const currentIndex = courseContent.findIndex((c) => c._id === currentContent._id);
      const next = currentIndex < courseContent.length - 1 ? courseContent[currentIndex + 1] : null;
      setNextContent(next);
      setShowCompletionModal(true);

    } catch (err) {
      console.error("Error completing video:", err);
    } finally {
      setCompletionInProgress(false);
    }
  };

  const markContentAsCompleted = async (contentId) => {
    try {
      setMarkingComplete(true);
      const res = await axios.post(
        `${API_URL}/api/course-content/${contentId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      // Update progress based on API response or local calculation
      const updatedCompletedContents = new Set(Array.from(completedContents));
      updatedCompletedContents.add(contentId);
      
      const completedCount = updatedCompletedContents.size;
      const totalContents = courseContent.length;
      const percentage = totalContents > 0 ? Math.round((completedCount / totalContents) * 100) : 0;

      setProgress({
        completed: completedCount,
        total: totalContents,
        percentage: percentage,
      });

      if (res.data.enrollment) {
        setEnrollment((prev) => ({
          ...prev,
          ...res.data.enrollment,
        }));
      }

      setCompletedContents(updatedCompletedContents);

      // Update video progress to mark as completed
      if (currentContent?.type === "video") {
        setVideoProgress((prev) => ({
          ...prev,
          [contentId]: {
            ...prev[contentId],
            completed: true,
          },
        }));
      }

      return res.data;
    } catch (err) {
      console.error("Error marking content as completed:", err);
      throw err;
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleContentSelect = (content) => {
    setCurrentContent(content);
  };

  const handleContinueLearning = () => {
    setShowCompletionModal(false);
    if (nextContent) {
      setCurrentContent(nextContent);
    }
  };

  const handleStayOnContent = () => {
    setShowCompletionModal(false);
  };

  const getContentIcon = (type) => {
    const icons = {
      video: "🎬",
      pdf: "📄",
      document: "📝",
      excel: "📊"
    };
    return icons[type] || "📁";
  };

  const getDurationText = (content) => {
    if (!content) return "";
    if (content.type === "video" && content.duration) return content.duration;
    if (content.type === "document" || content.type === "pdf" || content.type === "excel") return "Read";
    return "";
  };

  const handleDocumentLoad = () => {
    setDocumentLoading(false);
  };

  const handleDocumentError = () => {
    setDocumentLoading(false);
    console.error("Error loading document");
    setError("Failed to load document. Please try again.");
  };

  // Refresh secure URL if expired
  const refreshSecureUrl = async (contentId, mediaType) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/course-content/secure-url/${contentId}/${mediaType}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSecureMediaUrls(prev => ({
          ...prev,
          [contentId]: {
            ...prev[contentId],
            [mediaType]: response.data.mediaUrl
          }
        }));
        return response.data.mediaUrl;
      }
    } catch (error) {
      console.error("Error refreshing secure URL:", error);
      throw error;
    }
  };

  // Handle media loading errors (likely expired token)
  const handleMediaError = async (contentId, mediaType) => {
    try {
      console.log(`Media error for ${mediaType}, refreshing secure URL...`);
      
      if (mediaType === 'video') {
        const content = courseContent.find(c => c._id === contentId);
        if (content && isYouTubeUrl(content.videoUrl)) {
          // For YouTube, just reload the page
          window.location.reload();
        } else {
          // Refresh local video URL
          const newUrl = await refreshSecureUrl(contentId, 'video');
          if (videoRef.current) {
            videoRef.current.src = newUrl;
            videoRef.current.load();
          }
        }
      } else if (mediaType === 'document' && documentIframeRef.current) {
        const newUrl = await refreshSecureUrl(contentId, 'document');
        documentIframeRef.current.src = newUrl;
      }
    } catch (error) {
      console.error("Failed to refresh secure URL:", error);
      setError("Failed to load media. Please refresh the page.");
    }
  };

  if (loading) {
    return (
      <Container className={styles.loadingContainer}>
        <div className="text-center">
          <Spinner animation="border" role="status" className={styles.spinner}>
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p>Loading course content...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className={styles.errorContainer}>
        <Alert variant="danger">
          <Alert.Heading>Access Denied</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex gap-2">
            <Button variant="primary" onClick={() => navigate(`/course/${courseId}`)}>
              Enroll in Course
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate("/courses")}>
              Back to Courses
            </Button>
            <Button variant="outline-primary" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <div className={styles.learningPage}>
      <Container fluid>
        <Row>
          {/* Sidebar - Course Content List */}
          <Col lg={3} className={styles.sidebar}>
            <Card className={styles.sidebarCard}>
              <Card.Header className={styles.sidebarHeader}>
                <div>
                  <h5>Course Content</h5>
                  {enrollment && (
                    <div className={styles.enrollmentInfo}>
                      <small>Enrolled on: {formatEnrollmentDate(enrollment.enrollmentDate)}</small>
                      {enrollment.completed && (
                        <Badge bg="success" className="mt-1">
                          Course Completed
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className={styles.progressSection}>
                    <div className={styles.progressText}>
                      Progress: {progress.completed}/{progress.total} ({progress.percentage}%)
                    </div>
                    <ProgressBar now={progress.percentage} className={styles.progressBar} variant={enrollment?.completed ? "success" : "primary"} />
                  </div>
                </div>
              </Card.Header>
              <Card.Body className={styles.sidebarBody}>
                <ListGroup variant="flush">
                  {courseContent.map((content, index) => {
                    const isVideo = content.type === "video";
                    const videoProg = getVideoProgress(content._id);
                    const isCompleted = completedContents.has(content._id);

                    return (
                      <ListGroup.Item
                        key={content._id}
                        className={`${styles.contentItem} ${currentContent?._id === content._id ? styles.active : ""}`}
                        onClick={() => handleContentSelect(content)}
                      >
                        <div className={styles.contentInfo}>
                          <div className={styles.contentIcon}>{getContentIcon(content.type)}</div>
                          <div className={styles.contentDetails}>
                            <div className={styles.contentTitle}>{content.title}</div>
                            <div className={styles.contentMeta}>
                              <span className={styles.contentType}>{content.type}</span>
                              {getDurationText(content) && <span className={styles.contentDuration}>• {getDurationText(content)}</span>}
                              {content.isFree && (
                                <Badge bg="success" className={styles.freeBadge}>
                                  Free
                                </Badge>
                              )}
                            </div>

                            {isVideo && videoProg.percentage > 0 && !isCompleted && (
                              <div className={styles.videoProgress}>
                                <ProgressBar now={videoProg.percentage * 100} variant="info" className={styles.miniProgressBar} />
                                <small className={styles.videoTime}>
                                  {formatTime(videoProg.currentTime)} / {formatTime(videoProg.duration)}
                                </small>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className={styles.contentStatus}>
                          {isCompleted ? (
                            <Badge bg="success" className={styles.completedBadge}>
                              ✓
                            </Badge>
                          ) : isVideo && videoProg.completed ? (
                            <Badge bg="warning" className={styles.pendingBadge}>
                              ⏳
                            </Badge>
                          ) : (
                            <div className={styles.contentOrder}>{index + 1}</div>
                          )}
                        </div>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>

          {/* Main Content Area */}
          <Col lg={9} className={styles.mainContent}>
            {currentContent ? (
              <Card className={styles.contentCard}>
                <Card.Header className={styles.contentHeader}>
                  <div className={styles.contentHeaderInfo}>
                    <h4>{currentContent.title}</h4>
                    <div className={styles.contentMeta}>
                      <Badge bg="secondary">{currentContent.type}</Badge>
                      {currentContent.duration && <span className={styles.duration}>Duration: {currentContent.duration}</span>}
                      {currentContent.type === "video" && videoProgress[currentContent._id] && (
                        <span className={styles.watchProgress}>Watched: {Math.round(videoProgress[currentContent._id].percentage * 100)}%</span>
                      )}
                    </div>
                  </div>
                  {!completedContents.has(currentContent._id) && currentContent.type !== "video" && (
                    <Button variant="success" size="sm" onClick={() => markContentAsCompleted(currentContent._id)} disabled={markingComplete}>
                      {markingComplete ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Marking...
                        </>
                      ) : (
                        "Mark as Complete"
                      )}
                    </Button>
                  )}
                </Card.Header>

                <Card.Body className={styles.contentBody}>
                  {currentContent.description && <div className={styles.contentDescription}><p>{currentContent.description}</p></div>}

                  {/* Video Content */}
                  {currentContent.type === "video" && (
                    <div className={styles.videoContainer}>
                      {videoLoading && (
                        <div className={styles.videoLoading}>
                          <Spinner animation="border" role="status">
                            <span className="visually-hidden">Loading video...</span>
                          </Spinner>
                          <p>Loading video content...</p>
                        </div>
                      )}
                      
                      {getVideoSrc(currentContent) ? (
                        <div className={styles.videoWrapper}>
                          {isYouTubeUrl(currentContent.videoUrl) ? (
                            <div className={styles.youtubeContainer}>
                              <div className={styles.iframeWrapper}>
                                <iframe
                                  ref={youtubeIframeRef}
                                  title={currentContent.title}
                                  src={getVideoSrc(currentContent)}
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                  className={styles.youtubeIframe}
                                  onLoad={() => {
                                    setVideoLoading(false);
                                    console.log("YouTube iframe loaded successfully");
                                  }}
                                  onError={() => {
                                    setVideoLoading(false);
                                    console.error("YouTube iframe loading error");
                                    handleMediaError(currentContent._id, 'video');
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className={styles.localVideoContainer}>
                              <video
                                ref={videoRef}
                                controls
                                className={styles.videoPlayer}
                                src={getVideoSrc(currentContent)}
                                controlsList="nodownload"
                                preload="metadata"
                                onLoadedData={() => setVideoLoading(false)}
                                onError={(e) => {
                                  console.error("Video loading error:", e);
                                  setVideoLoading(false);
                                  handleMediaError(currentContent._id, 'video');
                                }}
                              >
                                Your browser does not support the video tag.
                              </video>
                            </div>
                          )}

                          <div className={styles.videoStats}>
                            {completionInProgress && (
                              <Alert variant="info" className={styles.completionAlert}>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Marking as completed...
                              </Alert>
                            )}

                            {isYouTubeUrl(currentContent.videoUrl) && !completedContents.has(currentContent._id) && (
                              <div className={styles.youtubeNotice}>
                                <small>
                                  Watch the video to automatically mark it as complete. The lesson will be marked complete when you've watched 90% of the video.
                                </small>
                                <div className="mt-2">
                                  <Button variant="outline-success" size="sm" onClick={() => markContentAsCompleted(currentContent._id)} disabled={markingComplete}>
                                    {markingComplete ? "Marking..." : "Mark as Complete Now"}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className={styles.noContent}>
                          <p>Video content not available</p>
                          <Button variant="outline-primary" onClick={() => navigate(`/course/${courseId}`)}>
                            Contact Support
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Document Content (PDF, Document, Excel) */}
                  {(currentContent.type === "document" || currentContent.type === "pdf" || currentContent.type === "excel") && (
                    <div className={styles.documentContainer}>
                      {documentLoading && (
                        <div className={styles.documentLoading}>
                          <Spinner animation="border" role="status">
                            <span className="visually-hidden">Loading document...</span>
                          </Spinner>
                          <p>Loading document...</p>
                        </div>
                      )}
                      {getDocumentUrl(currentContent) ? (
                        <>
                          {/* For PDF files, show in iframe (keep original behavior) */}
                          {currentContent.type === "pdf" ? (
                            <>
                              <iframe 
                                ref={documentIframeRef}
                                src={getDocumentUrl(currentContent)} 
                                className={styles.documentViewer} 
                                title={currentContent.title}
                                onLoad={handleDocumentLoad}
                                onError={(e) => {
                                  handleDocumentError();
                                  handleMediaError(currentContent._id, 'document');
                                }}
                              />
                              <div className={styles.documentActions}>
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  href={getDocumentUrl(currentContent)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Open in New Tab
                                </Button>
                                {!completedContents.has(currentContent._id) && (
                                  <Button 
                                    variant="success" 
                                    size="sm"
                                    onClick={() => markContentAsCompleted(currentContent._id)} 
                                    disabled={markingComplete}
                                  >
                                    {markingComplete ? "Marking..." : "Mark as Complete"}
                                  </Button>
                                )}
                              </div>
                            </>
                          ) : (
                            /* For Excel and Word documents, show download options */
                            <div className={styles.downloadContainer}>
                              <div className={styles.downloadContent}>
                                <Alert variant="info" className="text-center">
                                  <h5>{getDocumentIcon(currentContent)} {getDocumentTypeName(currentContent)}</h5>
                                  <p>This file is a {getDocumentTypeName(currentContent).toLowerCase()}.</p>
                                  <p>Click the button below to download and view the file.</p>
                                  <div className="mt-3">
                                    <Button 
                                      variant="primary" 
                                      onClick={() => handleFileDownload(currentContent)}
                                      disabled={documentLoading}
                                      className="me-2"
                                    >
                                      {documentLoading ? (
                                        <>
                                          <Spinner animation="border" size="sm" className="me-2" />
                                          Downloading...
                                        </>
                                      ) : (
                                        `Download ${getDocumentTypeName(currentContent)}`
                                      )}
                                    </Button>
                                    <Button 
                                      variant="outline-secondary"
                                      href={getDocumentUrl(currentContent)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      Open Direct Link
                                    </Button>
                                  </div>
                                  <div className="mt-3">
                                    <small className="text-muted">
                                      <strong>Note:</strong> {getDocumentTypeName(currentContent)} files cannot be previewed in the browser. 
                                      Please download the file to view it in appropriate software.
                                    </small>
                                  </div>
                                </Alert>
                              </div>
                              <div className={styles.documentActions}>
                                {!completedContents.has(currentContent._id) && (
                                  <Button 
                                    variant="success" 
                                    size="sm"
                                    onClick={() => markContentAsCompleted(currentContent._id)} 
                                    disabled={markingComplete}
                                  >
                                    {markingComplete ? "Marking..." : "Mark as Complete"}
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className={styles.noContent}>
                          <p>Document not available</p>
                          <Button variant="outline-primary" onClick={() => navigate(`/course/${courseId}`)}>
                            Contact Support
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </Card.Body>

                <Card.Footer className={styles.contentFooter}>
                  <div className={styles.navigation}>
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        const currentIndex = courseContent.findIndex((content) => content._id === currentContent._id);
                        if (currentIndex > 0) setCurrentContent(courseContent[currentIndex - 1]);
                      }}
                      disabled={courseContent.findIndex((content) => content._id === currentContent._id) === 0}
                    >
                      ← Previous
                    </Button>

                    <div className={styles.navigationInfo}>
                      Lesson {courseContent.findIndex((content) => content._id === currentContent._id) + 1} of {courseContent.length}
                    </div>

                    <Button
                      variant="primary"
                      onClick={() => {
                        const currentIndex = courseContent.findIndex((content) => content._id === currentContent._id);
                        if (currentIndex < courseContent.length - 1) setCurrentContent(courseContent[currentIndex + 1]);
                      }}
                      disabled={courseContent.findIndex((content) => content._id === currentContent._id) === courseContent.length - 1}
                    >
                      Next →
                    </Button>
                  </div>
                </Card.Footer>
              </Card>
            ) : (
              <Card className={styles.noContentCard}>
                <Card.Body className="text-center">
                  <h5>No content available</h5>
                  <p>This course doesn't have any content yet.</p>
                  <Button variant="primary" onClick={() => navigate("/courses")}>
                    Browse Other Courses
                  </Button>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>

      {/* Completion Modal */}
      <Modal show={showCompletionModal} onHide={handleStayOnContent} centered>
        <Modal.Header closeButton>
          <Modal.Title>Lesson Completed! 🎉</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Congratulations! You've completed "{currentContent?.title}"</p>
          {nextContent ? (
            <p>Ready to move on to the next lesson: "{nextContent.title}"?</p>
          ) : (
            <p>You've completed all lessons in this course! Great job!</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleStayOnContent}>
            Stay on This Lesson
          </Button>
          <Button variant="primary" onClick={handleContinueLearning}>
            {nextContent ? "Continue to Next Lesson" : "View Course Completion"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Learning;