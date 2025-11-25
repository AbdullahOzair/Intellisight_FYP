import React, { useState, useEffect } from 'react';
import { FiX, FiUpload, FiTrash2 } from 'react-icons/fi';
import { teacherAPI, zoneAPI } from '../api/api';
import axios from 'axios';

const AddTeacherModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        Name: '',
        Email: '',
        Zone_id: '',
        Camara_Id: ''
    });
    const [images, setImages] = useState([]);
    const [zones, setZones] = useState([]);
    const [cameras, setCameras] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchZones();
            fetchCameras();
        }
    }, [isOpen]);

    const fetchZones = async () => {
        try {
            const response = await zoneAPI.getAllZones();
            if (response.success && response.data) {
                setZones(response.data);
            }
        } catch (err) {
            console.error('Error fetching zones:', err);
        }
    };

    const fetchCameras = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:3000/api/cameras', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success && response.data.data) {
                setCameras(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching cameras:', err);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);

        if (images.length + files.length > 5) {
            setError('Maximum 5 images allowed');
            return;
        }

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImages(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.Name.trim()) {
            setError('Name is required');
            return;
        }
        if (!formData.Zone_id) {
            setError('Zone assignment is required');
            return;
        }
        if (images.length === 0) {
            setError('At least 1 face picture is required');
            return;
        }

        setLoading(true);

        try {
            const payload = {
                Name: formData.Name.trim(),
                Zone_id: parseInt(formData.Zone_id),
                Face_Pictures: images
            };

            // Add optional fields
            if (formData.Email && formData.Email.trim()) {
                payload.Email = formData.Email.trim();
            }
            if (formData.Camara_Id) {
                payload.Camara_Id = parseInt(formData.Camara_Id);
            }

            await teacherAPI.createTeacher(payload);

            setFormData({ Name: '', Email: '', Zone_id: '', Camara_Id: '' });
            setImages([]);
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error creating teacher:', err);
            console.log('Full error response:', err.response);
            
            let errorMessage = 'Failed to create teacher. Please check all fields.';
            
            if (err.response?.data) {
                const data = err.response.data;
                
                // Check for validation errors with details
                if (data.details && Array.isArray(data.details)) {
                    errorMessage = data.details.map(d => `${d.field}: ${d.message}`).join(', ');
                } else if (data.message) {
                    errorMessage = data.message;
                } else if (data.error) {
                    errorMessage = data.error;
                }
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800">Add New Teacher</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition"
                    >
                        <FiX size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="Name"
                            value={formData.Name}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="Enter teacher name"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            name="Email"
                            value={formData.Email}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="teacher@example.com"
                        />
                    </div>

                    {/* Zone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Zone Assignment <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="Zone_id"
                            value={formData.Zone_id}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                            <option value="">Select a zone</option>
                            {zones.map(zone => (
                                <option key={zone.Zone_id} value={zone.Zone_id}>
                                    {zone.Zone_Name || `Zone ${zone.Zone_id}`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Camera (Optional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Camera Assignment (Optional)
                        </label>
                        <select
                            name="Camara_Id"
                            value={formData.Camara_Id}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                            <option value="">Select a camera (optional)</option>
                            {cameras.map(camera => (
                                <option key={camera.Camara_Id} value={camera.Camara_Id}>
                                    Camera {camera.Camara_Id}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Face Pictures Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Face Pictures (1-5 images) <span className="text-red-500">*</span>
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <input
                                type="file"
                                id="imageUpload"
                                multiple
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                disabled={images.length >= 5}
                            />
                            <label
                                htmlFor="imageUpload"
                                className={`cursor-pointer flex flex-col items-center ${images.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            >
                                <FiUpload size={48} className="text-gray-400 mb-2" />
                                <span className="text-sm text-gray-600">
                                    {images.length >= 5
                                        ? 'Maximum images reached'
                                        : 'Click to upload images'}
                                </span>
                                <span className="text-xs text-gray-500 mt-1">
                                    {images.length}/5 images uploaded
                                </span>
                            </label>
                        </div>

                        {/* Image Previews */}
                        {images.length > 0 && (
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                {images.map((img, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={img}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-300"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                                        >
                                            <FiTrash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-800 font-semibold mb-1">Validation failed</p>
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || images.length === 0}
                            className={`px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition ${loading || images.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {loading ? 'Adding...' : 'Add Teacher'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTeacherModal;
