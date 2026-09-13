'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

interface Rental {
  id: string;
  tenant_first_name: string;
  tenant_last_name: string;
  tenant2_first_name: string | null;
  tenant2_last_name: string | null;
  tenant_email: string;
  entry_date: string;
}

interface Property {
  id: string;
  street_number: string;
  street_name: string;
  status?: string;
  apartment_number: string;
  floor: string;
  building_number: string;
  city: string;
  department: string;
  property_type: 'Appartement' | 'Maison';
  base_rent_price: number;
  service_charges: number;
  rentals: Rental[];
}

export default function Home() {
  // États pour la sélection depuis l'en-tête
  const [isEditSelectOpen, setIsEditSelectOpen] = useState(false);
  const [isDeleteSelectOpen, setIsDeleteSelectOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [properties, setProperties] = useState<Property[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Formulaire Bien Immobilier
  const [streetNumber, setStreetNumber] = useState('');
  const [streetName, setStreetName] = useState('');
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [buildingNumber, setBuildingNumber] = useState('');
  const [city, setCity] = useState('');
  const [department, setDepartment] = useState('');
  
  const [propertyType, setPropertyType] = useState<'Appartement' | 'Maison'>('Appartement');


  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    const { data, error } = await supabase.from('properties').select('*, rentals(*)');
    if (!error && data) {
      setProperties(data);
    }
  }

  // Sélectionner un bien à modifier depuis la liste popup
  function selectPropertyToEdit(bien: Property) {
    setEditingId(bien.id);
    setPropertyType(bien.property_type);
    setStreetNumber(bien.street_number || '');
    setStreetName(bien.street_name || '');
    setApartmentNumber(bien.apartment_number || '');
    setFloor(bien.floor || '');
    setBuildingNumber(bien.building_number || '');
    setCity(bien.city || '');
    setDepartment(bien.department || '');
    
    setIsEditSelectOpen(false);
    setIsModalOpen(true);
  }

  // Supprimer un bien directement depuis la liste popup
  async function handleDeleteFromList(id: string) {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce bien ?")) {
      const { error } = await supabase.from('properties').delete().eq('id', id);
      if (error) {
        alert("Erreur lors de la suppression : " + error.message);
      } else {
        setIsDeleteSelectOpen(false);
        fetchProperties();
      }
    }
  }



  async function handleAddProperty(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const propertyData = {
    street_number: streetNumber,
    street_name: streetName,
    apartment_number: propertyType === 'Appartement' ? apartmentNumber : null,
    floor: propertyType === 'Appartement' ? floor : null,
    building_number: propertyType === 'Appartement' ? buildingNumber : null,
    city,
    department,
    property_type: propertyType
  };

    if (editingId) {
      // MODE MODIFICATION
      const { error } = await supabase
        .from('properties')
        .update(propertyData)
        .eq('id', editingId);

      if (error) alert("Erreur lors de la modification : " + error.message);
    } else {
      // MODE CRÉATION
      const { error } = await supabase
        .from('properties')
        .insert([propertyData]);

      if (error) alert("Erreur lors de l'ajout du bien : " + error.message);
    }

    setLoading(false);
    resetForm();
    fetchProperties();
  }
  // Fonction pour supprimer un bien
  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault(); // Empêche d'ouvrir la page de détails du Link
    e.stopPropagation();

    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce bien ?")) {
      const { error } = await supabase.from('properties').delete().eq('id', id);
      if (error) {
        alert("Erreur lors de la suppression : " + error.message);
      } else {
        fetchProperties();
      }
    }
  }

  // Fonction pour ouvrir la modale en mode modification
  function handleOpenEdit(bien: Property, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    setEditingId(bien.id);
    setPropertyType(bien.property_type);
    setStreetNumber(bien.street_number || '');
    setStreetName(bien.street_name || '');
    setApartmentNumber(bien.apartment_number || '');
    setFloor(bien.floor || '');
    setBuildingNumber(bien.building_number || '');
    setCity(bien.city || '');
    setDepartment(bien.department || '');
    
    
    setIsModalOpen(true);
  }

  // Mettre à jour resetForm pour nettoyer aussi l'editingId
  function resetForm() {
    setEditingId(null);
    setStreetNumber('');
    setStreetName('');
    setApartmentNumber('');
    setFloor('');
    setBuildingNumber('');
    setCity('');
    setDepartment('');
    setIsModalOpen(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* En-tête */}
        <header className="flex justify-between items-center pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestion Immobilière</h1>
            <p className="text-slate-500 text-sm mt-1">Tableau de bord et suivi des locations</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsEditSelectOpen(true)}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium px-3 py-2 rounded-lg transition-colors text-sm"
            >
              Modifier un bien
            </button>
            <button 
              onClick={() => setIsDeleteSelectOpen(true)}
              className="bg-red-50 hover:bg-red-100 text-red-700 font-medium px-3 py-2 rounded-lg transition-colors text-sm"
            >
              Supprimer un bien
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors shadow-sm text-sm"
            >
              + Ajouter un bien
            </button>
          </div>
        </header>

        {/* Liste des biens */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Mes Biens Immobiliers</h2>
          {properties.length === 0 ? (
            <p className="text-slate-400 py-8 text-center">Aucun bien enregistré pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {properties.map((bien) => {
                const isOccupied = bien.rentals && bien.rentals.length > 0;
                const activeTenant = isOccupied ? bien.rentals[0] : null;

                const fullAddress = `${bien.street_number || ''} ${bien.street_name}`.trim();
                const cityInfo = `${bien.city} (${bien.department})`;

                return (
                  <Link 
                    href={`/bien/${bien.id}`} 
                    key={bien.id} 
                    className="p-5 border border-slate-200 rounded-lg bg-slate-50 flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition-all cursor-pointer block text-left"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          {bien.property_type}
                        </span>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          bien.status === 'Loué' ? 'bg-emerald-100 text-emerald-800' :
                          bien.status === 'Vendu' ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-200 text-slate-700'
                        }`}>
                          {bien.status || 'Vacant'}
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-lg text-slate-900 mb-0.5">{fullAddress}</h3>
                      <p className="text-sm text-slate-500 mb-2">{cityInfo}</p>
                      
                      {isOccupied && activeTenant && (
                        <div className="mt-3 p-3 bg-white rounded-md border border-slate-100 text-sm text-slate-600">
                          <p className="font-medium text-slate-800">
                            {activeTenant.tenant_first_name} {activeTenant.tenant_last_name}
                            {activeTenant.tenant2_first_name && ` & ${activeTenant.tenant2_first_name} ${activeTenant.tenant2_last_name}`}
                          </p>
                          <p>Bail débuté le : {new Date(activeTenant.entry_date).toLocaleDateString('fr-FR')}</p>
                          <p className="text-xs mt-1 text-slate-400">{activeTenant.tenant_email}</p>
                        </div>
                      )}
                    </div>

                    <div className="text-sm text-slate-700 pt-3 mt-4 border-t border-slate-200 flex justify-between">
                      <span>Loyer HC: <strong>{bien.base_rent_price} €</strong></span>
                      <span>Charges: <strong>{bien.service_charges} €</strong></span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Fenêtre Modale */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Modifier le bien immobilier</h2>
            
            <form onSubmit={handleAddProperty} className="space-y-6">
              
              {/* Section Bien */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">1. Informations du bien</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Type de bien</label>
                    <select 
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value as 'Appartement' | 'Maison')}
                      className="w-full border border-slate-300 rounded-lg p-2 mt-1 bg-white text-slate-900"
                    >
                      <option value="Appartement">Appartement</option>
                      <option value="Maison">Maison</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">Nom de rue *</label>
                    <input 
                      type="text" required value={streetName} onChange={(e) => setStreetName(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 mt-1 text-slate-900" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">N° de rue</label>
                    <input 
                      type="text" value={streetNumber} onChange={(e) => setStreetNumber(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 mt-1 text-slate-900" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">Ville *</label>
                    <input 
                      type="text" required value={city} onChange={(e) => setCity(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 mt-1 text-slate-900" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">Département (ex: 75000) *</label>
                    <input 
                      type="text" required value={department} onChange={(e) => setDepartment(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 mt-1 text-slate-900" 
                    />
                  </div>

                  {/* Champs conditionnels uniquement pour les Appartements */}
                  {propertyType === 'Appartement' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">N° d'appartement</label>
                        <input 
                          type="text" value={apartmentNumber} onChange={(e) => setApartmentNumber(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg p-2 mt-1 text-slate-900" 
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700">Étage</label>
                        <input 
                          type="text" value={floor} onChange={(e) => setFloor(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg p-2 mt-1 text-slate-900" 
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700">N° de bâtiment</label>
                        <input 
                          type="text" value={buildingNumber} onChange={(e) => setBuildingNumber(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg p-2 mt-1 text-slate-900" 
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

          

              {/* Boutons d'action */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modale de sélection pour MODIFIER */}
      {isEditSelectOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Quel bien souhaitez-vous modifier ?</h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {properties.map(b => (
                <div 
                  key={b.id} 
                  onClick={() => selectPropertyToEdit(b)}
                  className="p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer text-sm"
                >
                  <p className="font-semibold text-slate-900">{b.street_number || ''} {b.street_name}</p>
                  <p className="text-slate-500">{b.city} ({b.department})</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setIsEditSelectOpen(false)}
                className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-100 text-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de sélection pour SUPPRIMER */}
      {isDeleteSelectOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Quel bien souhaitez-vous supprimer ?</h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {properties.map(b => (
                <div 
                  key={b.id} 
                  onClick={() => handleDeleteFromList(b.id)}
                  className="p-3 border rounded-lg hover:bg-red-50 hover:border-red-300 cursor-pointer text-sm"
                >
                  <p className="font-semibold text-slate-900">{b.street_number || ''} {b.street_name}</p>
                  <p className="text-slate-500">{b.city} ({b.department})</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setIsDeleteSelectOpen(false)}
                className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-100 text-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}