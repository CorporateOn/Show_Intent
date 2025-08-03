'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { FoodItem } from '@/types';
import { TrashIcon, SparklesIcon } from '@/components/IconComponents';

type FormState = Omit<FoodItem, 'id' | 'isAvailable'>;

const AdminDashboard: React.FC = () => {
    const { 
      restaurantName, setRestaurantName,
      currency, setCurrency,
      adminPassword, setAdminPassword,
      waiterPassword, setWaiterPassword,
      backgroundImage, updateBackgroundImage,
      menuItems, addMenuItem, updateMenuItem, deleteMenuItem, toggleItemAvailability,
      categories, addCategory, updateCategory, deleteCategory,
      saveAllSettings, authStatus,
      logoUrl, logoType, setLogoType, updateLogo,
      textColor, setTextColor
    } = useAppContext();
    const router = useRouter();

    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
    const [formState, setFormState] = useState<FormState>({ name: '', description: '', price: 0, category: '', image: '' });
    const [isGenerating, setIsGenerating] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [editingCategory, setEditingCategory] = useState<{ old: string, new: string } | null>(null);
    const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (authStatus.isAuthenticated === false) { return; }
        if (authStatus.role !== 'admin') { router.push('/login'); }
    }, [authStatus, router]);

    useEffect(() => {
        if (categories.length > 0 && !formState.category) {
            setFormState(prev => ({...prev, category: categories[0]}));
        }
    }, [categories, formState.category]);

    useEffect(() => {
        if (editingItem) {
            setFormState({ name: editingItem.name, description: editingItem.description, price: editingItem.price, category: editingItem.category, image: editingItem.image });
        } else {
            resetForm();
        }
    }, [editingItem]);

    const handleSave = async () => {
        await saveAllSettings();
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);
    };
    
    const resetForm = () => {
        setFormState({ name: '', description: '', price: 0, category: categories[0] || '', image: '' });
        setEditingItem(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ 
            ...prev, 
            [name]: name === 'price' ? (parseFloat(value) || 0) : value 
        }));
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('file', file);
            try {
                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                const data = await res.json();
                if (data.url) setFormState(prev => ({...prev, image: data.url}));
                else alert('Image upload failed.');
            } catch (error) { console.error("Error uploading image:", error); alert('Image upload failed.'); }
        }
    };

    const handleBackgroundImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('file', file);
            try {
                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                const data = await res.json();
                if (data.url) await updateBackgroundImage(data.url);
                else alert('Background image upload failed.');
            } catch (error) { console.error("Error uploading background image:", error); alert('Background image upload failed.'); }
        }
    };
    
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('file', file);
            try {
                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                const data = await res.json();
                if (data.url) await updateLogo(data.url);
            } catch (error) { console.error("Error uploading logo:", error); alert('Logo upload failed.'); }
        }
    };

    const handleGenerateDescription = async () => {
        if (!formState.name) { alert("Please enter a name for the dish first."); return; }
        setIsGenerating(true);
        try {
            const res = await fetch('/api/generate-description', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemName: formState.name, category: formState.category }) });
            const data = await res.json();
            if (data.description) setFormState(prev => ({ ...prev, description: data.description }));
            else throw new Error(data.error || 'Failed to generate');
        } catch(e) { console.error(e); alert((e as Error).message); }
        finally { setIsGenerating(false); }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalFormState = { ...formState, image: formState.image || `https://picsum.photos/seed/${formState.name.replace(/\s/g, '')}/400/300` };
        if (editingItem) updateMenuItem({ ...editingItem, ...finalFormState });
        else addMenuItem(finalFormState);
        resetForm();
    };

    const handleAddCategory = () => { if(newCategory.trim()){ addCategory(newCategory.trim()); setNewCategory(''); } };

    const handleUpdateCategory = () => { if (editingCategory && editingCategory.new.trim()) { updateCategory(editingCategory.old, editingCategory.new.trim()); setEditingCategory(null); } };

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage({ type: '', text: '' });
        if (passwordForm.current !== adminPassword) { setPasswordMessage({ type: 'error', text: 'Current password is not correct.' }); return; }
        if (passwordForm.new.length < 6) { setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters.' }); return; }
        if (passwordForm.new !== passwordForm.confirm) { setPasswordMessage({ type: 'error', text: 'New passwords do not match.' }); return; }
        setAdminPassword(passwordForm.new);
        setPasswordMessage({ type: 'success', text: 'Password updated successfully! Save changes to make it permanent.' });
        setPasswordForm({ current: '', new: '', confirm: '' });
    };

    if (!authStatus.isAuthenticated || authStatus.role !== 'admin') {
        return <div className="flex items-center justify-center min-h-screen"><p>Loading or redirecting...</p></div>;
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            {showSaveSuccess && <div className="fixed top-20 right-5 z-50 bg-green-500 text-white py-3 px-6 rounded-lg shadow-lg animate-fade-in">Settings saved successfully!</div>}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-brand-dark">Admin Dashboard</h1>
                <button onClick={handleSave} className="bg-green-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600 transition-colors shadow-md">Save All Changes</button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-8">
                    
                    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-brand-dark mb-4">{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input type="text" name="name" value={formState.name} onChange={handleInputChange} className="w-full p-2 border rounded-md" required />
                            </div>
                            <div>
                                <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">Item Image</label>
                                <input type="file" name="image" onChange={handleImageChange} accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-brand-primary hover:file:bg-violet-100" />
                                {formState.image && <img src={formState.image} alt="Preview" className="mt-4 w-full h-32 object-cover rounded-md border" />}
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea name="description" value={formState.description} onChange={handleInputChange} rows={3} className="w-full p-2 border rounded-md"></textarea>
                                <button type="button" onClick={handleGenerateDescription} disabled={isGenerating} className="mt-2 w-full flex items-center justify-center text-sm bg-purple-100 text-purple-700 font-semibold py-2 px-4 rounded-md hover:bg-purple-200 transition-colors disabled:opacity-50">
                                    <SparklesIcon className="h-4 w-4 mr-2" />
                                    {isGenerating ? 'Generating...' : 'Generate with AI'}
                                </button>
                            </div>
                            <div>
                                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                                <input type="number" name="price" value={formState.price} onChange={handleInputChange} className="w-full p-2 border rounded-md" required step="0.01" />
                            </div>
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select name="category" value={formState.category} onChange={handleInputChange} className="w-full p-2 border rounded-md" required>
                                    <option value="" disabled>Select a category</option>
                                    {categories.map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div className="flex space-x-2">
                                <button type="submit" className="flex-1 bg-brand-primary text-white font-bold py-2 rounded-md hover:bg-indigo-700 transition-colors">{editingItem ? 'Update Item' : 'Add Item'}</button>
                                {editingItem && <button type="button" onClick={resetForm} className="flex-1 bg-gray-200 text-gray-800 font-bold py-2 rounded-md hover:bg-gray-300">Cancel</button>}
                            </div>
                        </div>
                    </form>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-brand-dark mb-4">Manage Categories</h2>
                        <div className="space-y-3 mb-4">
                            {categories.map((cat: string) => (
                                <div key={cat} className="flex items-center justify-between p-2 rounded-md border">
                                    {editingCategory?.old === cat ? (
                                        <input type="text" value={editingCategory.new} onChange={ e => setEditingCategory(prev => prev ? { ...prev, new: e.target.value } : null)} className="p-1 border rounded-md text-sm flex-grow"/>
                                    ) : (
                                        <span className="text-gray-700">{cat}</span>
                                    )}
                                    <div className="flex space-x-2 ml-2">
                                        {editingCategory?.old === cat ? (
                                            <button onClick={handleUpdateCategory} className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-md hover:bg-green-200">Save</button>
                                        ) : (
                                            <button onClick={() => setEditingCategory({ old: cat, new: cat })} className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-md hover:bg-blue-200">Edit</button>
                                        )}
                                        <button onClick={() => deleteCategory(cat)} className="p-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"><TrashIcon className="h-4 w-4"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex space-x-2">
                            <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="New category name" className="w-full p-2 border rounded-md" />
                            <button onClick={handleAddCategory} className="bg-gray-700 text-white font-semibold px-4 py-2 rounded-md hover:bg-gray-800">Add</button>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow-md">
                         <h2 className="text-2xl font-semibold text-brand-dark mb-4">Restaurant Settings</h2>
                         <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Header Display Type</label>
                                <div className="flex rounded-md shadow-sm">
                                    <button onClick={() => setLogoType('text')} className={`flex-1 px-4 py-2 text-sm rounded-l-md transition-colors ${logoType === 'text' ? 'bg-brand-primary text-white z-10' : 'bg-gray-100 hover:bg-gray-200'}`}>Text</button>
                                    <button onClick={() => setLogoType('logo')} className={`flex-1 px-4 py-2 text-sm -ml-px rounded-r-md transition-colors ${logoType === 'logo' ? 'bg-brand-primary text-white z-10' : 'bg-gray-100 hover:bg-gray-200'}`}>Logo</button>
                                </div>
                            </div>
                            
                            {logoType === 'text' && (
                                <div className="space-y-4 p-4 border rounded-md bg-gray-50">
                                    <div>
                                        <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                                        <input type="text" id="restaurantName" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} className="w-full p-2 border rounded-md"/>
                                    </div>
                                    <div>
                                        <label htmlFor="textColor" className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                                        <div className="flex items-center space-x-2">
                                            <input type="color" id="textColor" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-10 w-10 p-1 border rounded-md cursor-pointer"/>
                                            <input type="text" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full p-2 border rounded-md" placeholder="#1e293b"/>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {logoType === 'logo' && (
                                <div className="p-4 border rounded-md bg-gray-50">
                                    <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-1">Upload Logo</label>
                                    <input type="file" name="logo" onChange={handleLogoUpload} accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-brand-primary hover:file:bg-violet-100"/>
                                    {logoUrl && <img src={logoUrl} alt="Logo Preview" className="mt-4 max-h-24 w-auto bg-gray-100 p-2 rounded-md border" />}
                                    {logoUrl && <button onClick={() => updateLogo('')} className="mt-2 text-sm text-red-600 hover:text-red-800">Remove Logo</button>}
                                </div>
                            )}

                            <div>
                                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">Currency Symbol</label>
                                <input type="text" id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full p-2 border rounded-md"/>
                            </div>
                            <div>
                                <label htmlFor="backgroundImage" className="block text-sm font-medium text-gray-700 mb-1">Menu Background Image</label>
                                <input type="file" name="backgroundImage" onChange={handleBackgroundImageChange} accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-brand-primary hover:file:bg-violet-100" />
                                {backgroundImage && <img src={backgroundImage} alt="Background Preview" className="mt-4 w-full h-32 object-cover rounded-md border" />}
                                {backgroundImage && <button onClick={() => updateBackgroundImage('')} className="mt-2 text-sm text-red-600 hover:text-red-800">Remove Image</button>}
                            </div>
                         </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                         <h2 className="text-2xl font-semibold text-brand-dark mb-4">Security Settings</h2>
                         <form onSubmit={handlePasswordChange} className="space-y-3 mb-6">
                            <p className="font-semibold text-gray-700">Change Admin Password</p>
                            <input type="password" placeholder="Current Admin Password" value={passwordForm.current} onChange={e => setPasswordForm({...passwordForm, current: e.target.value})} className="w-full p-2 border rounded-md" required/>
                            <input type="password" placeholder="New Admin Password" value={passwordForm.new} onChange={e => setPasswordForm({...passwordForm, new: e.target.value})} className="w-full p-2 border rounded-md" required/>
                            <input type="password" placeholder="Confirm New Password" value={passwordForm.confirm} onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} className="w-full p-2 border rounded-md" required/>
                            <button type="submit" className="w-full bg-brand-secondary text-white font-bold py-2 rounded-md hover:bg-amber-500 transition-colors">Update Admin Password</button>
                            {passwordMessage.text && <p className={`text-sm mt-2 ${passwordMessage.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>{passwordMessage.text}</p>}
                         </form>
                         <div className="space-y-3">
                            <p className="font-semibold text-gray-700">Change Waiter Password</p>
                            <input type="text" placeholder="New Waiter Password" value={waiterPassword} onChange={e => setWaiterPassword(e.target.value)} className="w-full p-2 border rounded-md" required/>
                         </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-brand-dark mb-4">Current Menu</h2>
                        <div className="space-y-3">
                            {menuItems.length > 0 ? menuItems.map((item: FoodItem) => (
                                <div key={item.id} className="flex items-center p-3 rounded-md border hover:bg-gray-50 transition-colors">
                                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md mr-4 flex-shrink-0" />
                                    <div className="flex-grow">
                                        <p className="font-semibold text-gray-800">{item.name}</p>
                                        <p className="text-sm text-gray-500">{item.category} - {currency} {item.price.toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center space-x-3 flex-shrink-0">
                                        <div className="flex items-center space-x-2">
                                            <span className={`text-xs font-medium ${item.isAvailable ? 'text-green-600' : 'text-gray-500'}`}>{item.isAvailable ? 'Available' : 'Unavailable'}</span>
                                            <button onClick={() => toggleItemAvailability(item.id)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.isAvailable ? 'bg-green-400' : 'bg-gray-300'}`}>
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.isAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                        <button onClick={() => { setEditingItem(item); window.scrollTo(0,0); }} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200">Edit</button>
                                        <button onClick={() => deleteMenuItem(item.id)} className="p-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"><TrashIcon className="h-4 w-4" /></button>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-gray-500 py-8">No menu items yet. Add one using the form!</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;