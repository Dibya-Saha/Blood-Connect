import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, Plus, Search, Filter, AlertCircle, RefreshCw, Clock, 
  MapPin, Phone, Mail, Building2, ShieldAlert, CheckCircle2, 
  ChevronRight, Download, FileText, ExternalLink, Activity
} from 'lucide-react';
import { BloodGroup, BloodInventory, FacilityType } from '../types';
import { fetchAllInventory, fetchCriticalShortagesCount, updateBloodStock } from '../services/inventoryService';

interface InventoryProps {
  language: 'en' | 'bn';
  onNavigateToRequest?: (hospitalInfo: { name: string; address: string; phone: string }) => void;
}

const Inventory: React.FC<InventoryProps> = ({ language, onNavigateToRequest }) => {
  const [rawInventory, setRawInventory] = useState<BloodInventory[]>([]);
  const [criticalCount, setCriticalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSynced, setLastSynced] = useState<Date>(new Date());
  const [filterCity, setFilterCity] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterBlood, setFilterBlood] = useState('All');
  const [sortBy, setSortBy] = useState<'status' | 'updated'>('status');
  const [notifying, setNotifying] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [inventoryData, count] = await Promise.all([
        fetchAllInventory(),
        fetchCriticalShortagesCount()
      ]);
      setRawInventory(inventoryData);
      setCriticalCount(count);
      setLastSynced(new Date());
    } catch (error) {
      console.error("Inventory Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const processedInventory = useMemo(() => {
    const latestMap = new Map<string, BloodInventory>();
    rawInventory.forEach(item => {
      const key = `${item.hospitalId || item.hospitalName}_${item.bloodType}`;
      const existing = latestMap.get(key);
      if (!existing || new Date(item.lastUpdated) > new Date(existing.lastUpdated)) {
        latestMap.set(key, item);
      }
    });
    let list = Array.from(latestMap.values());

    if (searchQuery) {
      list = list.filter(item => 
        item.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterCity !== 'All') list = list.filter(item => item.city === filterCity);
    if (filterType !== 'All') list = list.filter(item => item.hospitalType === filterType);
    if (filterBlood !== 'All') list = list.filter(item => item.bloodType === filterBlood);

    list.sort((a, b) => {
      if (sortBy === 'status') {
        const order = { 'CRITICAL': 0, 'LOW': 1, 'OPTIMAL': 2 };
        return order[a.status] - order[b.status];
      }
      return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
    });

    return list;
  }, [rawInventory, searchQuery, filterCity, filterType, filterBlood, sortBy]);

  const divisionSummaries = useMemo(() => {
    const divisions: Record<string, number> = {};
    processedInventory.forEach(item => {
      divisions[item.division] = (divisions[item.division] || 0) + item.quantity;
    });
    return divisions;
  }, [processedInventory]);

  const criticalShortages = useMemo(() => {
    const criticalMap: Record<BloodGroup, { count: number, needed: number }> = {
      'O-': { count: 0, needed: 50 }, 'B-': { count: 0, needed: 30 },
      'A-': { count: 0, needed: 30 }, 'AB-': { count: 0, needed: 15 },
      'A+': { count: 0, needed: 100 }, 'B+': { count: 0, needed: 100 },
      'O+': { count: 0, needed: 100 }, 'AB+': { count: 0, needed: 50 },
    };
    
    rawInventory.forEach(item => {
      if (criticalMap[item.bloodType]) {
        criticalMap[item.bloodType].count += item.quantity;
      }
    });

    return Object.entries(criticalMap).filter(([_, data]) => data.count < data.needed);
  }, [rawInventory]);

  const bloodColors: Record<BloodGroup, string> = {
    'A+': 'bg-blue-600', 'A-': 'bg-blue-400',
    'O+': 'bg-red-600', 'O-': 'bg-red-500',
    'B+': 'bg-orange-600', 'B-': 'bg-orange-400',
    'AB+': 'bg-purple-600', 'AB-': 'bg-purple-400',
  };

  const getTimeAgo = (isoString: string) => {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    return `${Math.floor(diff/3600)}h ago`;
  };

  const getExpiryStatus = (expiryDate: string) => {
    const diffDays = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24));
    if (diffDays <= 3) return { label: `Expiring in ${diffDays}d`, color: 'text-red-600 bg-red-50 border-red-100', level: 'RED' };
    if (diffDays <= 7) return { label: `Expiring in ${diffDays}d`, color: 'text-yellow-600 bg-yellow-50 border-yellow-100', level: 'YELLOW' };
    return { label: 'Fresh stock', color: 'text-green-600 bg-green-50 border-green-100', level: 'GREEN' };
  };

  // Export to PDF
  const exportToPDF = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>BloodConnect Inventory Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #dc2626; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #dc2626; color: white; }
          .critical { background-color: #fee2e2; }
          .low { background-color: #fef3c7; }
          .optimal { background-color: #d1fae5; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>🩸 BloodConnect Bangladesh - Inventory Report</h1>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Total Records:</strong> ${processedInventory.length}</p>
        <table>
          <thead>
            <tr>
              <th>Hospital</th>
              <th>City</th>
              <th>Blood Type</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
            ${processedInventory.map(item => `
              <tr class="${item.status.toLowerCase()}">
                <td>${item.hospitalName}</td>
                <td>${item.city}</td>
                <td><strong>${item.bloodType}</strong></td>
                <td>${item.quantity} Units</td>
                <td>${item.status}</td>
                <td>${item.phone}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>© 2025 BloodConnect Bangladesh | Connecting Donors, Saving Lives</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Export to Excel (CSV format)
  const exportToExcel = () => {
    const headers = ['Hospital Name', 'Type', 'City', 'Division', 'Blood Type', 'Quantity', 'Status', 'Expiry Date', 'Phone', 'Email', '24/7'];
    const rows = processedInventory.map(item => [
      item.hospitalName,
      item.hospitalType,
      item.city,
      item.division,
      item.bloodType,
      item.quantity,
      item.status,
      new Date(item.expiryDate).toLocaleDateString(),
      item.phone,
      item.email,
      item.is247 ? 'Yes' : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bloodconnect_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Notify matching donors
  const notifyMatchingDonors = async () => {
    if (criticalShortages.length === 0) {
      alert('No critical shortages to notify about.');
      return;
    }

    setNotifying(true);
    setNotifySuccess(null);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const criticalBloodType = criticalShortages[0][0] as BloodGroup;
      const hospitalWithShortage = processedInventory.find(
        item => item.bloodType === criticalBloodType && item.status === 'CRITICAL'
      );

      const response = await fetch(`${API_URL}/notifications/notify-donors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bloodGroup: criticalBloodType,
          hospitalName: hospitalWithShortage?.hospitalName || 'Multiple Hospitals',
          unitsNeeded: criticalShortages[0][1].needed - criticalShortages[0][1].count,
          urgency: 'EMERGENCY',
          contactPhone: hospitalWithShortage?.phone || '+880 XXX XXXX',
          district: hospitalWithShortage?.city || 'Dhaka'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setNotifySuccess(`✅ Successfully notified ${data.successCount} donors via email!`);
        setTimeout(() => setNotifySuccess(null), 5000);
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Notification error:', error);
      alert('Failed to send notifications. Please check if backend is running.');
    } finally {
      setNotifying(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-gray-900 uppercase tracking-widest text-[10px] flex items-center gap-2">
              <Activity size={14} className="text-red-600" />
              Division-wise Inventory
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={exportToPDF}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors" 
                title="Export PDF"
              >
                <FileText size={18} />
              </button>
              <button 
                onClick={exportToExcel}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors" 
                title="Export Excel"
              >
                <Download size={18} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(divisionSummaries).map(([div, count]) => (
              <div key={div} className="text-center p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{div}</p>
                <p className="text-xl font-black text-gray-900">{count}U</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:w-96 bg-red-600 rounded-[2rem] p-6 text-white shadow-xl shadow-red-200 relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="animate-pulse" />
              Critical Shortages
            </h3>
            <div className="space-y-3 mb-6">
              {criticalShortages.slice(0, 3).map(([type, data]) => (
                <div key={type} className="flex items-center justify-between text-xs font-bold bg-white/10 p-2.5 rounded-xl border border-white/10">
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${bloodColors[type as BloodGroup]}`}></span>
                    {type} Type
                  </span>
                  <span>{data.count} / {data.needed} Units</span>
                </div>
              ))}
            </div>
            {notifySuccess && (
              <div className="mb-4 p-3 bg-green-500 text-white rounded-xl text-xs font-bold">
                {notifySuccess}
              </div>
            )}
            <button 
              onClick={notifyMatchingDonors}
              disabled={notifying}
              className="w-full bg-white text-red-600 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {notifying ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Sending...
                </>
              ) : (
                <>
                  Notify Matching Donors <ChevronRight size={14} />
                </>
              )}
            </button>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform">
            <ShieldAlert size={150} />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hospital or city..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-red-500/10 focus:outline-none font-bold text-sm"
            />
          </div>
          <div className="flex gap-2">
            <select 
              className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl text-xs font-bold outline-none cursor-pointer"
              value={filterCity} onChange={(e) => setFilterCity(e.target.value)}
            >
              <option value="All">All Cities</option>
              <option value="Dhaka">Dhaka</option>
              <option value="Chittagong">Chittagong</option>
              <option value="Bogura">Bogura</option>
            </select>
            <select 
              className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl text-xs font-bold outline-none cursor-pointer"
              value={filterType} onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="All">All Facility Types</option>
              <option value="GOVERNMENT">Government</option>
              <option value="PRIVATE">Private</option>
              <option value="THALASSEMIA_CENTER">Thalassemia Center</option>
            </select>
            <button 
              onClick={fetchData}
              className="p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin text-red-600' : 'text-gray-400'} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50/50 text-gray-500">
            <tr>
              <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Facility Details</th>
              <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px]">Contact & Type</th>
              <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px]">Blood Type</th>
              <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px]">Stock level</th>
              <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px]">Expiry Check</th>
              <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {processedInventory.map((item) => {
              const expiry = getExpiryStatus(item.expiryDate);
              return (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${item.hospitalType === 'GOVERNMENT' ? 'bg-green-50 text-green-600' : item.hospitalType === 'THALASSEMIA_CENTER' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                        {item.hospitalType === 'GOVERNMENT' ? <ShieldAlert size={20} /> : item.hospitalType === 'THALASSEMIA_CENTER' ? <Activity size={20} /> : <Building2 size={20} />}
                      </div>
                      <div>
                        <p className="font-black text-gray-900 group-hover:text-red-600 transition-colors">{item.hospitalName}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter flex items-center gap-1">
                          <MapPin size={10} /> {item.city}, {item.division}
                          {item.is247 && <span className="ml-2 text-green-600 bg-green-50 px-1 rounded">24/7 OPEN</span>}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-700 flex items-center gap-2"><Phone size={10} className="text-gray-400" /> {item.phone}</p>
                      <p className="text-[10px] text-gray-400 font-medium flex items-center gap-2"><Mail size={10} className="text-gray-400" /> {item.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className={`w-12 h-12 ${bloodColors[item.bloodType]} text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-red-100`}>
                      {item.bloodType}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="w-32">
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[10px] font-black uppercase ${item.status === 'CRITICAL' ? 'text-red-600 animate-pulse' : 'text-gray-400'}`}>
                          {item.status}
                        </span>
                        <span className="text-xs font-black text-gray-900">{item.quantity}U</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${item.status === 'CRITICAL' ? 'bg-red-500' : item.status === 'LOW' ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min((item.quantity/150)*100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${expiry.color}`}>
                      <Clock size={12} className={expiry.level === 'RED' ? 'animate-spin-slow' : ''} />
                      <span className="text-[10px] font-black uppercase">{expiry.label}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          if (onNavigateToRequest) {
                            onNavigateToRequest({
                              name: item.hospitalName,
                              address: `${item.city}, ${item.division}`,
                              phone: item.phone
                            });
                          }
                        }}
                        className="p-2 bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" 
                        title="Request Blood"
                      >
                        <ExternalLink size={16} />
                      </button>
                      <button className="p-2 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Update Stock">
                        <RefreshCw size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {processedInventory.length === 0 && (
          <div className="p-20 text-center">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200">
              <Database className="text-gray-300" size={32} />
            </div>
            <h4 className="font-black text-gray-900 mb-1">No matches found</h4>
            <p className="text-xs font-bold text-gray-400 uppercase">Try adjusting your filters</p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">
        <span>© 2025 BloodConnect BD</span>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          Server synchronized: {getTimeAgo(lastSynced.toISOString())}
        </div>
      </div>
    </div>
  );
};

export default Inventory;