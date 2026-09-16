import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowUpRight, Pencil, Trash2, Plus, X, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import type { MenuItem, RestaurantInfo, SessionUser } from '@/lib/types';

const money = (value: number) => `${new Intl.NumberFormat('en-US').format(value)} ETB`;

type AdminPanelProps = {
  user: SessionUser | null;
  onClose: () => void;
  onLogin: (user: SessionUser) => void;
  onLogout: () => void;
  menuItems: MenuItem[];
  setMenuItems: (items: MenuItem[]) => void;
  restaurantInfo: RestaurantInfo;
  setRestaurantInfo: (info: RestaurantInfo) => void;
  reloadMenu: () => void;
};

export function AdminPanel(props: AdminPanelProps) {
  const {
    user,
    onClose,
    onLogin,
    onLogout,
    menuItems,
    setMenuItems,
    restaurantInfo,
    setRestaurantInfo,
    reloadMenu,
  } = props;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [view, setView] = useState<'menu' | 'info'>('menu');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showNewItem, setShowNewItem] = useState(false);
  const [busy, setBusy] = useState(false);

  const authenticate = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    setBusy(true);
    try {
      const result = await api.login(email, password);
      onLogin(result.user);
      setView('menu');
      setMessage('Signed in. You can manage the menu now.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sign in failed.');
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    await api.logout();
    onLogout();
    setMessage('');
  };

  if (!user) {
    return (
      <div className="admin-overlay">
        <div className="admin-panel admin-slide-in">
          <button className="admin-close" onClick={onClose}><X size={20} /></button>
          <div className="section-kicker">Private access</div>
          <h2>Staff<br /><em>portal.</em></h2>
          <p className="admin-lead">
            Sign in to manage menu items, hover food images, prices, and restaurant details.
            Changes appear on the live site instantly.
          </p>
          <form onSubmit={authenticate} className="auth-form">
            <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" /></label>
            <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="current-password" /></label>
            <button className="primary-button" type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'} <ArrowUpRight size={17} />
            </button>
          </form>
          {message && <p className="admin-message">{message}</p>}
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
          <button className={view === 'info' ? 'active' : ''} onClick={() => setView('info')}>Hours & phone</button>
          <button className="admin-sign-out" onClick={() => void signOut()}>Sign out</button>
        </div>

        {view === 'menu' && (
          <>
            <div className="admin-add-row">
              <button className="primary-button" onClick={() => setShowNewItem(true)}><Plus size={16} /> Add new item</button>
            </div>
            <div className="admin-menu-list">
              {menuItems.map((item) => (
                <div className="admin-menu-card" key={item.id}>
                  {item.image_url && (
                    <img className="admin-menu-thumb" src={item.image_url} alt="" />
                  )}
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
                    <button
                      aria-label="Delete item"
                      onClick={() => void deleteItem(item.id, menuItems, setMenuItems, setMessage)}
                    >
                      <Trash2 size={16} />
                    </button>
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
              try {
                const row = await api.createMenuItem(data);
                setMenuItems([...menuItems, row].sort((a, b) => a.sort_order - b.sort_order));
                reloadMenu();
                setShowNewItem(false);
                setMessage('Item added.');
              } catch (error) {
                setMessage(error instanceof Error ? error.message : 'Could not add item.');
              }
            }}
          />
        )}

        {editingItem && (
          <ItemEditor
            mode="edit"
            item={editingItem}
            onClose={() => setEditingItem(null)}
            onSave={async (data) => {
              try {
                const row = await api.updateMenuItem(editingItem.id, data);
                setMenuItems(menuItems.map((m) => (m.id === editingItem.id ? row : m)).sort((a, b) => a.sort_order - b.sort_order));
                reloadMenu();
                setEditingItem(null);
                setMessage('Item updated.');
              } catch (error) {
                setMessage(error instanceof Error ? error.message : 'Could not update item.');
              }
            }}
          />
        )}

        {message && <p className="admin-message">{message}</p>}
      </div>
    </div>
  );
}

async function deleteItem(
  id: string,
  menuItems: MenuItem[],
  setMenuItems: (items: MenuItem[]) => void,
  setMessage: (msg: string) => void,
) {
  if (!window.confirm('Delete this menu item?')) return;
  try {
    await api.deleteMenuItem(id);
    setMenuItems(menuItems.filter((m) => m.id !== id));
    setMessage('Item deleted.');
  } catch (error) {
    setMessage(error instanceof Error ? error.message : 'Could not delete item.');
  }
}

function RestaurantInfoEditor({
  info,
  setInfo,
  setMessage,
}: {
  info: RestaurantInfo;
  setInfo: (i: RestaurantInfo) => void;
  setMessage: (m: string) => void;
}) {
  const [form, setForm] = useState(info);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await api.updateRestaurant(form);
      setInfo(updated);
      setMessage('Restaurant info saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save info.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="info-editor">
      <h3>Edit location, hours & phone</h3>
      <label>Address<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
      <label>Address detail<input value={form.address_detail} onChange={(e) => setForm({ ...form, address_detail: e.target.value })} /></label>
      <label>Hours label (e.g. Open / Closed)<input value={form.hours_label} onChange={(e) => setForm({ ...form, hours_label: e.target.value })} /></label>
      <label>Hours<input value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} /></label>
      <label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
      <label>Phone label<input value={form.phone_label} onChange={(e) => setForm({ ...form, phone_label: e.target.value })} /></label>
      <button className="primary-button" disabled={saving} onClick={() => void save()}>
        {saving ? 'Saving…' : 'Save changes'} <ArrowUpRight size={16} />
      </button>
    </div>
  );
}

function ItemEditor({
  mode,
  item,
  onClose,
  onSave,
}: {
  mode: 'create' | 'edit';
  item?: MenuItem;
  onClose: () => void;
  onSave: (data: Partial<MenuItem>) => void | Promise<void>;
}) {
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [category, setCategory] = useState(item?.category ?? 'Canary signatures');
  const [price, setPrice] = useState(item?.price ?? 0);
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? '');
  const [showHover, setShowHover] = useState(item?.show_hover_image ?? true);
  const [isAvailable, setIsAvailable] = useState(item?.is_available ?? true);
  const [sortOrder, setSortOrder] = useState(item?.sort_order ?? 99);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const uploadImage = async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const result = await api.uploadImage(file);
      setImageUrl(result.url);
      setShowHover(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const submit = () => {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    void onSave({
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      price: Number(price),
      image_url: imageUrl || null,
      show_hover_image: showHover,
      is_available: isAvailable,
      sort_order: Number(sortOrder),
    });
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
          <label>Image URL<input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="/images/example.png or upload below" /></label>
          <label className="file-upload-label">Upload food image (shown on hover)
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadImage(f);
              }}
            />
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
          {error && <p className="admin-message">{error}</p>}
          <button className="primary-button" onClick={submit} disabled={uploading}>
            Save item <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
