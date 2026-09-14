import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowUpRight, Pencil, Trash2, Plus, X, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { MenuItem, RestaurantInfo, SessionUser } from '@/lib/types';

const money = (value: number) => `${new Intl.NumberFormat('en-US').format(value)} ETB`;

type AdminPanelProps = {
  user: SessionUser | null;
  authMode: 'signin' | 'signup';
  setAuthMode: (m: 'signin' | 'signup') => void;
  onClose: () => void;
  menuItems: MenuItem[];
  setMenuItems: (items: MenuItem[]) => void;
  restaurantInfo: RestaurantInfo;
  setRestaurantInfo: (info: RestaurantInfo) => void;
  reloadMenu: () => void;
};

export function AdminPanel(props: AdminPanelProps) {
  const { user, authMode, setAuthMode, onClose, menuItems, setMenuItems, restaurantInfo, setRestaurantInfo, reloadMenu } = props;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [view, setView] = useState<'auth' | 'menu' | 'info'>('auth');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showNewItem, setShowNewItem] = useState(false);

  const authenticate = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    const result = authMode === 'signin'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (result.error) { setMessage(result.error.message); return; }
    if (authMode === 'signup') { setMessage('Account created. You can now manage the menu.'); setView('menu'); }
    else setView('menu');
  };

  if (!user) {
    return (
      <div className="admin-overlay">
        <div className="admin-panel admin-slide-in">
          <button className="admin-close" onClick={onClose}><X size={20} /></button>
          <div className="section-kicker">Private access</div>
          <h2>Staff<br /><em>portal.</em></h2>
          <p className="admin-lead">Sign in to manage menu items, prices, images, and restaurant details. Changes appear on the live site instantly.</p>
          <form onSubmit={authenticate} className="auth-form">
            <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
            <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></label>
            <button className="primary-button" type="submit">{authMode === 'signin' ? 'Sign in' : 'Create account'} <ArrowUpRight size={17} /></button>
          </form>
          {message && <p className="admin-message">{message}</p>}
          <button className="switch-auth" onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}>
            {authMode === 'signin' ? 'Need to create the first staff account?' : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-overlay">
      <div className="admin-panel admin-slide-in">
        <button className="admin-close" onClick={onClose}><X size={20} /></button>
        <div className="admin-tabs">
          <button className={view === 'menu' ? 'active' : ''} onClick={() => setView('menu')}>Menu items</button>
          <button className={view === 'info' ? 'active' : ''} onClick={() => setView('info')}>Restaurant info</button>
          <button className="admin-sign-out" onClick={() => void supabase.auth.signOut()}>Sign out</button>
        </div>

        {view === 'menu' && (
          <>
            <div className="admin-add-row">
              <button className="primary-button" onClick={() => setShowNewItem(true)}><Plus size={16} /> Add new item</button>
            </div>
            <div className="admin-menu-list">
              {menuItems.map((item) => (
                <div className="admin-menu-card" key={item.id}>
                  <div className="admin-menu-card-info">
                    <strong>{item.name}</strong>
                    <span>{item.category} · {money(item.price)}</span>
                    <p>{item.description}</p>
                    <div className="admin-flags">
                      <span className={item.is_available ? 'flag-on' : 'flag-off'}>{item.is_available ? 'Visible' : 'Hidden'}</span>
                      <span className={item.show_hover_image ? 'flag-on' : 'flag-off'}>{item.show_hover_image ? 'Hover image on' : 'Hover image off'}</span>
                    </div>
                  </div>
                  <div className="admin-menu-card-actions">
                    <button aria-label="Edit item" onClick={() => setEditingItem(item)}><Pencil size={16} /></button>
                    <button aria-label="Delete item" onClick={() => void deleteItem(item.id, menuItems, setMenuItems, setMessage)}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {view === 'info' && (
          <RestaurantInfoEditor info={restaurantInfo} setInfo={setRestaurantInfo} setMessage={setMessage} />
        )}

        {showNewItem && (
          <ItemEditor
            mode="create"
            onClose={() => setShowNewItem(false)}
            onSave={async (data) => {
              const { data: row, error } = await supabase.from('menu_items').insert({ ...data, user_id: user.id }).select().maybeSingle();
              if (error) { setMessage(error.message); return; }
              if (row) { setMenuItems([...menuItems, row as MenuItem].sort((a, b) => a.sort_order - b.sort_order)); reloadMenu(); }
              setShowNewItem(false);
              setMessage('Item added.');
            }}
          />
        )}

        {editingItem && (
          <ItemEditor
            mode="edit"
            item={editingItem}
            onClose={() => setEditingItem(null)}
            onSave={async (data) => {
              const { data: row, error } = await supabase.from('menu_items').update({ ...data, user_id: user.id, updated_at: new Date().toISOString() }).eq('id', editingItem.id).select().maybeSingle();
              if (error) { setMessage(error.message); return; }
              if (row) { setMenuItems(menuItems.map((m) => m.id === editingItem.id ? row as MenuItem : m).sort((a, b) => a.sort_order - b.sort_order)); reloadMenu(); }
              setEditingItem(null);
              setMessage('Item updated.');
            }}
          />
        )}

        {message && <p className="admin-message">{message}</p>}
      </div>
    </div>
  );
}

async function deleteItem(id: string, menuItems: MenuItem[], setMenuItems: (items: MenuItem[]) => void, setMessage: (msg: string) => void) {
  const { error } = await supabase.from('menu_items').delete().eq('id', id);
  if (error) { setMessage(error.message); return; }
  setMenuItems(menuItems.filter((m) => m.id !== id));
  setMessage('Item deleted.');
}

function RestaurantInfoEditor({ info, setInfo, setMessage }: { info: RestaurantInfo; setInfo: (i: RestaurantInfo) => void; setMessage: (m: string) => void }) {
  const [form, setForm] = useState(info);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('restaurant_info').update({
      address: form.address,
      address_detail: form.address_detail,
      hours: form.hours,
      hours_label: form.hours_label,
      phone: form.phone,
      phone_label: form.phone_label,
    }).eq('id', 1);
    setSaving(false);
    if (error) { setMessage(error.message); return; }
    setInfo(form);
    setMessage('Restaurant info saved.');
  };

  return (
    <div className="info-editor">
      <h3>Edit location & hours</h3>
      <label>Address<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
      <label>Address detail<input value={form.address_detail} onChange={(e) => setForm({ ...form, address_detail: e.target.value })} /></label>
      <label>Hours label<input value={form.hours_label} onChange={(e) => setForm({ ...form, hours_label: e.target.value })} /></label>
      <label>Hours<input value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} /></label>
      <label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
      <label>Phone label<input value={form.phone_label} onChange={(e) => setForm({ ...form, phone_label: e.target.value })} /></label>
      <button className="primary-button" disabled={saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save changes'} <ArrowUpRight size={16} /></button>
    </div>
  );
}

function ItemEditor({ mode, item, onClose, onSave }: { mode: 'create' | 'edit'; item?: MenuItem; onClose: () => void; onSave: (data: Partial<MenuItem>) => void }) {
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [category, setCategory] = useState(item?.category ?? 'Canary signatures');
  const [price, setPrice] = useState(item?.price ?? 0);
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? '');
  const [showHover, setShowHover] = useState(item?.show_hover_image ?? false);
  const [isAvailable, setIsAvailable] = useState(item?.is_available ?? true);
  const [sortOrder, setSortOrder] = useState(item?.sort_order ?? 99);
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `menu-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('menu-images').upload(fileName, file, { upsert: true });
    setUploading(false);
    if (upErr) { alert(upErr.message); return; }
    const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(fileName);
    setImageUrl(urlData.publicUrl);
  };

  const submit = () => {
    onSave({ name, description, category, price: Number(price), image_url: imageUrl || null, show_hover_image: showHover, is_available: isAvailable, sort_order: Number(sortOrder) });
  };

  return (
    <div className="admin-overlay item-editor-overlay">
      <div className="admin-panel admin-slide-in">
        <button className="admin-close" onClick={onClose}><X size={20} /></button>
        <h3>{mode === 'create' ? 'Add new' : 'Edit'} menu item</h3>
        <div className="item-editor-form">
          <label>Name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label>Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></label>
          <label>Category<input value={category} onChange={(e) => setCategory(e.target.value)} /></label>
          <label>Price (ETB)<input type="number" min="0" value={price} onChange={(e) => setPrice(Number(e.target.value))} /></label>
          <label>Sort order<input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} /></label>
          <label>Image URL<input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="/images/example.png" /></label>
          <label className="file-upload-label">Or upload an image
            <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadImage(f); }} />
            {uploading && <span className="upload-status">Uploading…</span>}
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={showHover} onChange={(e) => setShowHover(e.target.checked)} />
            {showHover ? <Eye size={16} /> : <EyeOff size={16} />} Show food image on hover
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} />
            {isAvailable ? <Eye size={16} /> : <EyeOff size={16} />} Visible on public menu
          </label>
          {imageUrl && <img className="item-preview" src={imageUrl} alt="Preview" />}
          <button className="primary-button" onClick={submit}>Save item <ArrowUpRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}
