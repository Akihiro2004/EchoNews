import { Cloudinary } from 'cloudinary-core';

// Initialize Cloudinary
const cloudinary = new Cloudinary({
  cloud_name: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME,
  secure: true
});

// Upload image to Cloudinary
export const uploadImageToCloudinary = async (file, folder = 'echo-news') => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return {
      success: true,
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate optimized image URL
export const getOptimizedImageUrl = (publicId, options = {}) => {
  const defaultOptions = {
    quality: 'auto',
    fetch_format: 'auto',
    crop: 'fill',
    gravity: 'auto',
    ...options
  };

  return cloudinary.url(publicId, defaultOptions);
};

// Delete image from Cloudinary
export const deleteImageFromCloudinary = async (publicId) => {
  try {
    // Note: For deletion, you'll need to implement server-side endpoint
    // as it requires API secret which shouldn't be exposed in frontend
    console.warn('Image deletion should be implemented on server-side');
    return { success: false, message: 'Deletion not implemented' };
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return { success: false, error: error.message };
  }
};

// Transform image utilities
export const transformImageUrl = (url, transformations) => {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  const transformation = Object.entries(transformations)
    .map(([key, value]) => `${key}_${value}`)
    .join(',');

  return url.replace('/upload/', `/upload/${transformation}/`);
};

// Common transformation presets
export const imagePresets = {
  avatar: {
    width: 150,
    height: 150,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    format: 'auto'
  },
  thumbnail: {
    width: 300,
    height: 200,
    crop: 'fill',
    quality: 'auto',
    format: 'auto'
  },
  card: {
    width: 400,
    height: 250,
    crop: 'fill',
    quality: 'auto',
    format: 'auto'
  },
  hero: {
    width: 1200,
    height: 600,
    crop: 'fill',
    quality: 'auto',
    format: 'auto'
  }
};

export default cloudinary;
