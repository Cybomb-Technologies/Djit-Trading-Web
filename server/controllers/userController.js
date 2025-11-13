const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const bcrypt = require('bcryptjs');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = ['uploads/profile-pictures/', 'uploads/csv-imports/'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};
createUploadDirs();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile-pictures/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Configure multer for CSV uploads
const csvStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/csv-imports/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'contacts-' + uniqueSuffix + '.csv');
  }
});

const csvUpload = multer({
  storage: csvStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed!'), false);
    }
  }
});

// Helper function to parse date
const parseDate = (dateString) => {
  if (!dateString || dateString === '' || dateString === 'NULL') return null;
  
  try {
    // Remove any quotes and trim
    const cleanDate = dateString.toString().replace(/['"]/g, '').trim();
    if (!cleanDate) return null;

    const date = new Date(cleanDate);
    if (!isNaN(date.getTime())) {
      return date;
    }

    // Try different date formats
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
      /^\d{4}\/\d{2}\/\d{2}$/ // YYYY/MM/DD
    ];

    for (let format of formats) {
      if (format.test(cleanDate)) {
        const parsed = new Date(cleanDate);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
    }

    return null;
  } catch (error) {
    console.warn(`Failed to parse date: ${dateString}`, error);
    return null;
  }
};

// Helper function to clean phone number
const cleanPhoneNumber = (phone) => {
  if (!phone || phone === '' || phone === 'NULL') return '';
  return phone.toString().replace(/[^\d+]/g, '');
};

// Helper function to generate username from email
const generateUsername = (email, index) => {
  if (!email) return `user_${Date.now()}_${index}`;
  
  try {
    let baseUsername = email.toLowerCase().split('@')[0];
    baseUsername = baseUsername.replace(/[^a-zA-Z0-9]/g, '');
    
    if (baseUsername.length < 3) {
      return `user_${Date.now()}_${index}`;
    }
    
    return baseUsername;
  } catch (error) {
    return `user_${Date.now()}_${index}`;
  }
};

// Helper function to validate email
const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.toString().toLowerCase().trim());
};

// Helper function to get course IDs from labels
const getCourseIdsFromLabels = async (labels) => {
  const courseIds = [];
  
  if (!labels || labels.length === 0) return courseIds;

  const courseMappings = {
    // Basics Course
    'Basics of Trading': '691432e3a0d0eb697d30ca7c',
    'Basics of Trading Group member': '691432e3a0d0eb697d30ca7c',
    
    // Djit Hunter Course  
    'Djit Hunter - Master Entry Course': '6914693bb36796123050b4a8',
    'Hunters Group member': '6914693bb36796123050b4a8'
  };

  for (const label of labels) {
    const trimmedLabel = label.trim();
    if (courseMappings[trimmedLabel]) {
      courseIds.push(courseMappings[trimmedLabel]);
      console.log(`🎯 Mapped "${trimmedLabel}" → Course ID: ${courseMappings[trimmedLabel]}`);
    }
  }

  return [...new Set(courseIds)];
};
// Helper function to enroll user in courses
const enrollUserInCourses = async (userId, courseIds, results, rowNumber) => {
  const enrollments = [];
  
  for (const courseId of courseIds) {
    try {
      // Check if enrollment already exists
      const existingEnrollment = await Enrollment.findOne({
        user: userId,
        course: courseId
      });

      if (existingEnrollment) {
        console.log(`⚠️ User ${userId} already enrolled in course ${courseId}`);
        continue;
      }

      // Get course details
      const course = await Course.findById(courseId);
      if (!course) {
        console.warn(`⚠️ Course ${courseId} not found`);
        continue;
      }

      // Create enrollment
      const enrollmentData = {
        user: userId,
        course: courseId,
        amountPaid: course.discountedPrice || course.price || 0,
        paymentStatus: 'completed', // Mark as completed for imported users
        enrollmentDate: new Date()
      };

      const enrollment = await Enrollment.create(enrollmentData);
      enrollments.push(enrollment);

      // Update course enrollment count
      course.studentsEnrolled += 1;
      await course.save();

      console.log(`✅ Enrolled user ${userId} in course: ${course.title}`);

    } catch (error) {
      console.error(`❌ Error enrolling user in course ${courseId}:`, error.message);
      results.enrollmentErrors.push(`Row ${rowNumber}: Failed to enroll in course - ${error.message}`);
    }
  }

  return enrollments;
};

// Get all users (admin only)
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { 'profile.firstName': { $regex: search, $options: 'i' } },
          { 'profile.lastName': { $regex: search, $options: 'i' } },
          { 'profile.phone': { $regex: search, $options: 'i' } },
          { 'profile.tradingSegment': { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total: total, // Total users matching the query
      totalUsers: total // Add this for frontend compatibility
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Import users from CSV - UPDATED VERSION with auto-enrollment
exports.importUsers = [
  csvUpload.single('csvFile'),
  async (req, res) => {
    console.log('=== CSV IMPORT STARTED ===');
    console.log('CSV import request received');
    console.log('Request headers:', req.headers);
    console.log('Request body keys:', Object.keys(req.body));
    
    try {
      if (!req.file) {
        console.log('❌ No file in request');
        return res.status(400).json({
          success: false,
          message: 'No CSV file uploaded'
        });
      }

      console.log(`📁 Processing file: ${req.file.originalname}`);
      console.log(`📊 File size: ${req.file.size} bytes`);
      console.log(`📁 File path: ${req.file.path}`);

      const results = {
        total: 0,
        successful: 0,
        failed: 0,
        enrollments: 0,
        enrollmentErrors: [],
        errors: []
      };

      // Process CSV file
      const rows = [];
      console.log('📖 Starting CSV file reading...');
      
      await new Promise((resolve, reject) => {
        if (!fs.existsSync(req.file.path)) {
          reject(new Error('CSV file not found at path: ' + req.file.path));
          return;
        }

        const stream = fs.createReadStream(req.file.path)
          .pipe(csv({
            mapHeaders: ({ header, index }) => {
              // Normalize header names
              const normalizedHeader = header ? header.trim().toLowerCase().replace(/\s+/g, ' ') : `column_${index}`;
              return normalizedHeader;
            },
            mapValues: ({ value }) => {
              // Handle empty values and trim
              return value && value !== 'NULL' && value !== 'null' ? value.toString().trim() : '';
            },
            skipEmptyLines: true,
            strict: false
          }))
          .on('data', (row) => {
            // Only add row if it has at least one non-empty value
            const hasData = Object.values(row).some(value => value && value !== '');
            if (hasData) {
              rows.push(row);
              if (rows.length === 1) {
                console.log('📋 First row sample:', row);
              }
            }
          })
          .on('end', () => {
            console.log(`✅ CSV parsing completed. Found ${rows.length} valid rows.`);
            console.log('📋 Available columns in first row:', rows.length > 0 ? Object.keys(rows[0]) : 'No rows');
            resolve();
          })
          .on('error', (error) => {
            console.error('❌ CSV stream error:', error);
            reject(new Error(`CSV parsing failed: ${error.message}`));
          });

        stream.on('error', (error) => {
          console.error('❌ Stream error:', error);
          reject(error);
        });
      });

      if (rows.length === 0) {
        throw new Error('CSV file is empty or contains no valid data');
      }

      console.log(`🔄 Starting to process ${rows.length} rows...`);

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // +2 because CSV headers are row 1
        
        try {
          results.total++;

          // Get email from various possible column names
          const email = row['email 1'] || row['email1'] || row['email'] || 
                       row['email 2'] || row['email2'] || row['primary email'] ||
                       row['email address'] || row['contact email'];

          console.log(`📧 Processing row ${rowNumber}, email: ${email || 'NOT FOUND'}`);

          // Validate email
          if (!email) {
            results.failed++;
            const errorMsg = `Row ${rowNumber}: No email address found`;
            results.errors.push(errorMsg);
            console.log(`❌ ${errorMsg}`);
            continue;
          }

          if (!isValidEmail(email)) {
            results.failed++;
            const errorMsg = `Row ${rowNumber}: Invalid email format - "${email}"`;
            results.errors.push(errorMsg);
            console.log(`❌ ${errorMsg}`);
            continue;
          }

          const normalizedEmail = email.toLowerCase().trim();

          // Check if user already exists
          const existingUser = await User.findOne({ email: normalizedEmail });
          if (existingUser) {
            results.failed++;
            const errorMsg = `Row ${rowNumber}: User with email ${normalizedEmail} already exists`;
            results.errors.push(errorMsg);
            console.log(`❌ ${errorMsg}`);
            continue;
          }

          // Generate username with index to ensure uniqueness
          const username = generateUsername(normalizedEmail, i);
          
          // Check if username exists and make unique if needed
          let finalUsername = username;
          let usernameCounter = 1;
          while (await User.findOne({ username: finalUsername })) {
            finalUsername = `${username}${usernameCounter}`;
            usernameCounter++;
          }

          // Generate a secure random password
          const tempPassword = Math.random().toString(36).slice(-8) + 
                              Math.random().toString(36).slice(-8);

          // Parse dates
          const birthday = parseDate(row['birthdate'] || row['birthday'] || row['date of birth']);
          const createdAtUTC = parseDate(row['created at (utc+0)'] || row['created at'] || row['join date']);
          const lastActivityDate = parseDate(row['last activity date (utc+0)'] || row['last activity']);

          // Clean phone numbers
          const phone1 = cleanPhoneNumber(row['phone 1'] || row['phone1'] || row['phone'] || row['primary phone']);
          const phone2 = cleanPhoneNumber(row['phone 2'] || row['phone2'] || row['secondary phone']);

          // Parse labels - this is where we get course enrollment information
          const labels = row['labels'] ? 
            row['labels'].split(';').map(label => label.trim()).filter(label => label) : 
            [];

          console.log(`🏷️ Labels found for ${normalizedEmail}:`, labels);

          // Create user data
          const userData = {
            username: finalUsername,
            email: normalizedEmail,
            password: tempPassword,
            importSource: 'csv_import',
            importDate: new Date(),
            profile: {
              firstName: (row['first name'] || row['firstname'] || '').trim(),
              lastName: (row['last name'] || row['lastname'] || '').trim(),
              phone: phone1,
              phone2: phone2,
              birthday: birthday,
              discordId: (row['discord id'] || row['discord'] || row['discordid'] || '').trim(),
              tradingViewId: (row['tradingview id'] || row['tradingview'] || row['tradingviewid'] || '').trim(),
              tradingSegment: (row['trading segment'] || row['segment'] || '').trim(),
              badge: (row['badge'] || 'Beginner').trim(),
              
              // Primary Address
              address: {
                street: (row['address 1 - street'] || row['address1'] || row['street'] || '').trim(),
                city: '',
                state: '',
                zipCode: '',
                country: ''
              },
              
              labels: labels,
              emailSubscriberStatus: (row['email subscriber status'] || row['email status'] || '').trim(),
              smsSubscriberStatus: (row['sms subscriber status'] || row['sms status'] || '').trim(),
              source: (row['source'] || '').trim(),
              language: (row['language'] || '').trim(),
              lastActivity: (row['last activity'] || '').trim(),
              lastActivityDate: lastActivityDate,
              createdAtUTC: createdAtUTC
            }
          };

          // Secondary Address
          if (row['address 2 - street'] || row['address2']) {
            userData.profile.address2 = {
              type: (row['address 2 - type'] || row['addresstype'] || '').trim(),
              street: (row['address 2 - street'] || row['address2'] || '').trim(),
              city: (row['address 2 - city'] || '').trim(),
              state: (row['address 2 - state/region'] || row['state2'] || '').trim(),
              zipCode: (row['address 2 - zip'] || row['zip2'] || '').trim(),
              country: (row['address 2 - country'] || row['country2'] || '').trim()
            };
          }

          // Tertiary Address
          if (row['address 3 - street'] || row['address3']) {
            userData.profile.address3 = {
              street: (row['address 3 - street'] || row['address3'] || '').trim()
            };
          }

          // If Address 1 has data but Address 2 doesn't, move Address 1 data to address field
          if (row['address 1 - street'] && !row['address 2 - street']) {
            userData.profile.address = {
              street: (row['address 1 - street'] || '').trim(),
              city: (row['address 2 - city'] || '').trim(),
              state: (row['address 2 - state/region'] || '').trim(),
              zipCode: (row['address 2 - zip'] || '').trim(),
              country: (row['address 2 - country'] || '').trim()
            };
          }

          console.log(`💾 Saving user: ${normalizedEmail}`);
          const user = new User(userData);
          await user.save();
          results.successful++;
          console.log(`✅ Successfully imported user: ${normalizedEmail}`);

          // AUTO-ENROLLMENT LOGIC - After user is created
          if (labels.length > 0) {
            console.log(`🎯 Checking course enrollment for user: ${normalizedEmail}`);
            const courseIds = await getCourseIdsFromLabels(labels);
            
            if (courseIds.length > 0) {
              console.log(`📚 Enrolling user in courses: ${courseIds}`);
              const enrollments = await enrollUserInCourses(user._id, courseIds, results, rowNumber);
              results.enrollments += enrollments.length;
              console.log(`✅ Enrolled user in ${enrollments.length} courses`);
            } else {
              console.log(`ℹ️ No course mappings found for labels: ${labels}`);
            }
          }

        } catch (error) {
          results.failed++;
          const errorMsg = `Row ${rowNumber}: ${error.message}`;
          results.errors.push(errorMsg);
          console.error(`❌ Error processing row ${rowNumber}:`, error.message);
          console.error('Full error:', error);
        }
      }

      // Delete the uploaded CSV file after processing
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
          console.log('🧹 Cleaned up uploaded CSV file');
        }
      } catch (cleanupError) {
        console.warn('⚠️ Could not delete uploaded file:', cleanupError.message);
      }

      console.log(`🎉 Import completed: ${results.successful}/${results.total} users imported successfully`);
      console.log(`📚 Enrollments created: ${results.enrollments}`);
      console.log(`❌ Failed: ${results.failed}`);
      console.log('=== CSV IMPORT FINISHED ===');

      res.json({
        success: true,
        message: 'CSV import completed',
        results
      });

    } catch (error) {
      console.error('💥 CSV import error:', error);
      console.error('Error stack:', error.stack);
      
      if (req.file && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
          console.log('🧹 Cleaned up file during error');
        } catch (cleanupError) {
          console.warn('⚠️ Could not delete uploaded file during error cleanup:', cleanupError.message);
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'Error importing CSV file',
        error: error.message
      });
    }
  }
];

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { 
      phone, 
      birthday, 
      address, 
      address2,
      address3,
      tradingViewId, 
      tradingSegment,
      firstName,
      lastName,
      phone2,
      discordId,
      profilePicture,
      emailSubscriberStatus,
      smsSubscriberStatus,
      source,
      language,
      lastActivity,
      lastActivityDate,
      labels
    } = req.body;
    
    const updateData = {
      'profile.phone': phone,
      'profile.birthday': birthday ? parseDate(birthday) : undefined,
      'profile.tradingViewId': tradingViewId,
      'profile.tradingSegment': tradingSegment,
      'profile.firstName': firstName,
      'profile.lastName': lastName,
      'profile.phone2': phone2,
      'profile.discordId': discordId,
      'profile.profilePicture': profilePicture,
      'profile.emailSubscriberStatus': emailSubscriberStatus,
      'profile.smsSubscriberStatus': smsSubscriberStatus,
      'profile.source': source,
      'profile.language': language,
      'profile.lastActivity': lastActivity,
      'profile.lastActivityDate': lastActivityDate ? parseDate(lastActivityDate) : undefined,
      'profile.labels': labels
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Add address fields if provided
    if (address) {
      updateData['profile.address.street'] = address.street;
      updateData['profile.address.city'] = address.city;
      updateData['profile.address.state'] = address.state;
      updateData['profile.address.zipCode'] = address.zipCode;
      updateData['profile.address.country'] = address.country;
    }

    if (address2) {
      updateData['profile.address2.type'] = address2.type;
      updateData['profile.address2.street'] = address2.street;
      updateData['profile.address2.city'] = address2.city;
      updateData['profile.address2.state'] = address2.state;
      updateData['profile.address2.zipCode'] = address2.zipCode;
      updateData['profile.address2.country'] = address2.country;
    }

    if (address3) {
      updateData['profile.address3.street'] = address3.street;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: updateData
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// In the uploadProfilePicture function, update the baseUrl logic:

// In the uploadProfilePicture function:
exports.uploadProfilePicture = [
  upload.single('profilePicture'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Use consistent backend URL
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
      
      const profilePicture = {
        url: `${backendUrl}/uploads/profile-pictures/${req.file.filename}`,
        filename: req.file.filename,
        // Add relative path for frontend processing
        relativePath: `/uploads/profile-pictures/${req.file.filename}`
      };

      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          $set: {
            'profile.profilePicture': profilePicture
          }
        },
        { new: true }
      ).select('-password');

      if (!user) {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'Profile picture uploaded successfully',
        profilePicture,
        user
      });

    } catch (error) {
      console.error('Profile picture upload error:', error);
      
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({
        success: false,
        message: 'Error uploading profile picture',
        error: error.message
      });
    }
  }
];

// Get current user profile
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// Get user details for admin
exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching user details',
      error: error.message
    });
  }
};

// Update user role (admin only)
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating user role',
      error: error.message
    });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting user',
      error: error.message
    });
  }
};