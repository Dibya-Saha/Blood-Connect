import React, { useState, useEffect } from 'react';
import { Droplet, MapPin, Phone, Clock, AlertTriangle, Send, CheckCircle2, X, Calendar, Building, User as UserIcon, Navigation2 } from 'lucide-react';
import { BloodGroup, User } from '../types';
import { createBloodRequest, getMyRequests, cancelRequest } from '../services/requestService';

interface RequestBloodProps {
  language: 'en' | 'bn';
  user: User;
}

interface MyRequest {
  id: string;
  bloodGroup: BloodGroup;
  unitsNeeded: number;
  urgency: 'EMERGENCY' | 'URGENT' | 'NORMAL';
  hospitalName: string;
  location: {
    address: string;
  };
  contactPhone: string;
  status: 'OPEN' | 'FULFILLED' | 'CANCELLED';
  createdAt: string;
}

const RequestBlood: React.FC<RequestBloodProps> = ({ language, user }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [myRequests, setMyRequests] = useState<MyRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const [formData, setFormData] = useState({
    bloodGroup: 'A+' as BloodGroup,
    unitsNeeded: 1,
    urgency: 'URGENT' as 'EMERGENCY' | 'URGENT' | 'NORMAL',
    hospitalName: '',
    address: '',
    contactPhone: user.phone || '',
    patientName: '',
    relationship: '',
    additionalNotes: '',
    isThalassemiaPatient: false
  });

  useEffect(() => {
    loadMyRequests();
  }, []);

  const loadMyRequests = async () => {
    try {
      const requests = await getMyRequests();
      setMyRequests(requests);
    } catch (error) {
      console.error('Load requests error:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Validation
      if (!formData.hospitalName.trim()) {
        throw new Error(language === 'en' ? 'Hospital name is required' : 'হাসপাতালের নাম প্রয়োজন');
      }
      if (!formData.address.trim()) {
        throw new Error(language === 'en' ? 'Address is required' : 'ঠিকানা প্রয়োজন');
      }
      if (!formData.patientName.trim()) {
        throw new Error(language === 'en' ? 'Patient name is required' : 'রোগীর নাম প্রয়োজন');
      }
      if (formData.unitsNeeded < 1 || formData.unitsNeeded > 10) {
        throw new Error(language === 'en' ? 'Units needed must be between 1-10' : 'ইউনিট ১-১০ এর মধ্যে হতে হবে');
      }

      await createBloodRequest(formData);
      
      setShowSuccess(true);
      
      // Reset form
      setFormData({
        ...formData,
        hospitalName: '',
        address: '',
        patientName: '',
        relationship: '',
        additionalNotes: '',
        unitsNeeded: 1,
        urgency: 'URGENT',
        isThalassemiaPatient: false
      });

      // Reload requests
      loadMyRequests();

      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);

    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm(language === 'en' ? 'Are you sure you want to cancel this request?' : 'আপনি কি এই অনুরোধটি বাতিল করতে চান?')) {
      return;
    }

    try {
      await cancelRequest(requestId);
      loadMyRequests();
    } catch (error) {
      alert(language === 'en' ? 'Failed to cancel request' : 'অনুরোধ বাতিল করতে ব্যর্থ');
    }
  };

  const labels = {
    title: { en: 'Request Blood', bn: 'রক্তের অনুরোধ' },
    subtitle: { en: 'Submit an urgent blood requirement', bn: 'জরুরী রক্তের প্রয়োজনীয়তা জমা দিন' },
    patientInfo: { en: 'Patient Information', bn: 'রোগীর তথ্য' },
    requestDetails: { en: 'Request Details', bn: 'অনুরোধের বিবরণ' },
    locationInfo: { en: 'Location & Contact', bn: 'অবস্থান এবং যোগাযোগ' },
    patientName: { en: 'Patient Name', bn: 'রোগীর নাম' },
    relationship: { en: 'Your Relationship', bn: 'আপনার সম্পর্ক' },
    bloodGroup: { en: 'Blood Group Needed', bn: 'প্রয়োজনীয় রক্তের গ্রুপ' },
    unitsNeeded: { en: 'Units Needed', bn: 'প্রয়োজনীয় ইউনিট' },
    urgency: { en: 'Urgency Level', bn: 'জরুরী স্তর' },
    hospitalName: { en: 'Hospital Name', bn: 'হাসপাতালের নাম' },
    address: { en: 'Hospital Address', bn: 'হাসপাতালের ঠিকানা' },
    contactPhone: { en: 'Contact Phone', bn: 'যোগাযোগের ফোন' },
    additionalNotes: { en: 'Additional Notes', bn: 'অতিরিক্ত নোট' },
    thalassemia: { en: 'Thalassemia Patient', bn: 'থ্যালাসেমিয়া রোগী' },
    submit: { en: 'Submit Request', bn: 'অনুরোধ জমা দিন' },
    submitting: { en: 'Submitting...', bn: 'জমা দেওয়া হচ্ছে...' },
    myRequests: { en: 'My Requests', bn: 'আমার অনুরোধ' },
    noRequests: { en: 'No requests yet', bn: 'এখনও কোনো অনুরোধ নেই' },
    cancel: { en: 'Cancel', bn: 'বাতিল' },
    open: { en: 'Open', bn: 'খোলা' },
    fulfilled: { en: 'Fulfilled', bn: 'পূরণ হয়েছে' },
    cancelled: { en: 'Cancelled', bn: 'বাতিল' },
    emergency: { en: 'Emergency', bn: 'জরুরী' },
    urgent: { en: 'Urgent', bn: 'জরুরি' },
    normal: { en: 'Normal', bn: 'সাধারণ' },
    successTitle: { en: 'Request Submitted!', bn: 'অনুরোধ জমা হয়েছে!' },
    successMsg: { en: 'Your blood request has been submitted. Nearby donors will be notified.', bn: 'আপনার রক্তের অনুরোধ জমা দেওয়া হয়েছে। নিকটবর্তী দাতাদের জানানো হবে।' }
  };

  const relationships = ['Self', 'Parent', 'Spouse', 'Child', 'Sibling', 'Friend', 'Other'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-red-200 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
              <Droplet size={32} fill="white" />
            </div>
            <div>
              <h1 className="text-3xl font-black">{labels.title[language]}</h1>
              <p className="text-red-100 font-medium">{labels.subtitle[language]}</p>
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
              <p className="text-xs font-bold text-red-100 uppercase">Your Blood Group</p>
              <p className="text-2xl font-black">{user.bloodGroup}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
              <p className="text-xs font-bold text-red-100 uppercase">Active Requests</p>
              <p className="text-2xl font-black">{myRequests.filter(r => r.status === 'OPEN').length}</p>
            </div>
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 opacity-10">
          <Droplet size={300} fill="white" />
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-6 flex items-start gap-4 animate-in slide-in-from-top-4">
          <div className="bg-green-500 p-2 rounded-xl">
            <CheckCircle2 className="text-white" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-black text-green-900 text-lg mb-1">{labels.successTitle[language]}</h3>
            <p className="text-green-700 font-medium">{labels.successMsg[language]}</p>
          </div>
          <button onClick={() => setShowSuccess(false)} className="text-green-600 hover:text-green-800">
            <X size={20} />
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-6 flex items-start gap-4">
          <AlertTriangle className="text-red-600" size={24} />
          <div className="flex-1">
            <p className="text-red-800 font-bold">{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-600 hover:text-red-800">
            <X size={20} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Request Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Patient Information */}
              <section>
                <h3 className="text-sm font-black text-red-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <UserIcon size={16} /> {labels.patientInfo[language]}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase ml-2">{labels.patientName[language]} *</label>
                    <input 
                      type="text"
                      placeholder="e.g. John Doe"
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-base font-bold focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
                      required
                      value={formData.patientName}
                      onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase ml-2">{labels.relationship[language]}</label>
                    <select 
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-base font-bold appearance-none cursor-pointer focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
                      value={formData.relationship}
                      onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                    >
                      <option value="">Select relationship</option>
                      {relationships.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              </section>

              {/* Request Details */}
              <section>
                <h3 className="text-sm font-black text-red-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Droplet size={16} /> {labels.requestDetails[language]}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase ml-2">{labels.bloodGroup[language]} *</label>
                    <select 
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-base font-bold appearance-none cursor-pointer focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({...formData, bloodGroup: e.target.value as BloodGroup})}
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase ml-2">{labels.unitsNeeded[language]} *</label>
                    <input 
                      type="number"
                      min="1"
                      max="10"
                      placeholder="1-10"
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-base font-bold focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
                      required
                      value={formData.unitsNeeded}
                      onChange={(e) => setFormData({...formData, unitsNeeded: parseInt(e.target.value) || 1})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase ml-2">{labels.urgency[language]} *</label>
                    <select 
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-base font-bold appearance-none cursor-pointer focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
                      value={formData.urgency}
                      onChange={(e) => setFormData({...formData, urgency: e.target.value as any})}
                    >
                      <option value="EMERGENCY">🚨 {labels.emergency[language]}</option>
                      <option value="URGENT">⚠️ {labels.urgent[language]}</option>
                      <option value="NORMAL">✓ {labels.normal[language]}</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="flex items-center gap-3 cursor-pointer p-4 bg-purple-50 border border-purple-200 rounded-2xl hover:bg-purple-100 transition-colors">
                    <input 
                      type="checkbox"
                      checked={formData.isThalassemiaPatient}
                      onChange={(e) => setFormData({...formData, isThalassemiaPatient: e.target.checked})}
                      className="w-5 h-5 text-purple-600 rounded"
                    />
                    <span className="text-sm font-black text-purple-900">{labels.thalassemia[language]}</span>
                  </label>
                </div>
              </section>

              {/* Location & Contact */}
              <section>
                <h3 className="text-sm font-black text-red-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <MapPin size={16} /> {labels.locationInfo[language]}
                </h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase ml-2">{labels.hospitalName[language]} *</label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input 
                        type="text"
                        placeholder="e.g. Dhaka Medical College Hospital"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-base font-bold focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
                        required
                        value={formData.hospitalName}
                        onChange={(e) => setFormData({...formData, hospitalName: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase ml-2">{labels.address[language]} *</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-4 text-gray-400" size={20} />
                      <textarea 
                        placeholder="e.g. Bakshibazar, Dhaka - 1000"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-base font-bold focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all resize-none"
                        required
                        rows={2}
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase ml-2">{labels.contactPhone[language]} *</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input 
                        type="tel"
                        placeholder="+8801XXXXXXXXX"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-base font-bold focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
                        required
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase ml-2">{labels.additionalNotes[language]}</label>
                    <textarea 
                      placeholder="Any additional information..."
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-base font-bold focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all resize-none"
                      rows={3}
                      value={formData.additionalNotes}
                      onChange={(e) => setFormData({...formData, additionalNotes: e.target.value})}
                    />
                  </div>
                </div>
              </section>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red-600 text-white py-5 rounded-[2rem] font-black shadow-2xl shadow-red-200 hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-base"
              >
                {isSubmitting ? (
                  <>{labels.submitting[language]}</>
                ) : (
                  <>
                    <Send size={20} />
                    {labels.submit[language]}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* My Requests Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-6">
            <h3 className="font-black text-gray-900 text-lg mb-6 flex items-center gap-2">
              <Clock size={20} className="text-red-600" />
              {labels.myRequests[language]}
            </h3>

            {loadingRequests ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : myRequests.length === 0 ? (
              <div className="text-center py-8">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Droplet className="text-gray-400" size={24} />
                </div>
                <p className="text-sm font-bold text-gray-400">{labels.noRequests[language]}</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                {myRequests.map(request => (
                  <div 
                    key={request.id}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      request.status === 'OPEN' 
                        ? 'border-red-200 bg-red-50' 
                        : request.status === 'FULFILLED'
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        request.urgency === 'EMERGENCY' 
                          ? 'bg-red-600 text-white' 
                          : request.urgency === 'URGENT'
                          ? 'bg-orange-500 text-white'
                          : 'bg-blue-500 text-white'
                      }`}>
                        {request.urgency}
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        request.status === 'OPEN' 
                          ? 'bg-red-100 text-red-700' 
                          : request.status === 'FULFILLED'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {labels[request.status.toLowerCase() as keyof typeof labels][language]}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-red-600 text-white rounded-xl flex items-center justify-center font-black">
                        {request.bloodGroup}
                      </div>
                      <div>
                        <p className="font-black text-gray-900 text-sm">{request.unitsNeeded} Units</p>
                        <p className="text-[10px] font-bold text-gray-500">{request.hospitalName}</p>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-600 font-medium mb-3 flex items-center gap-1">
                      <MapPin size={12} />
                      {request.location.address}
                    </p>
                    
                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold">
                      <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                      {request.status === 'OPEN' && (
                        <button 
                          onClick={() => handleCancelRequest(request.id)}
                          className="text-red-600 hover:text-red-700 font-black uppercase"
                        >
                          {labels.cancel[language]}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <AlertTriangle className="text-white" size={20} />
              </div>
              <div>
                <h4 className="font-black text-blue-900 text-sm mb-2">Important Notice</h4>
                <ul className="text-xs text-blue-800 space-y-1 font-medium">
                  <li>• Ensure all information is accurate</li>
                  <li>• Keep your phone accessible</li>
                  <li>• Hospital staff may contact you</li>
                  <li>• Donors will be notified immediately</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestBlood;