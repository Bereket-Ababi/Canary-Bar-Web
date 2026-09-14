export type MenuItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string | null;
  show_hover_image: boolean;
  is_available: boolean;
  sort_order: number;
  user_id: string | null;
};

export type RestaurantInfo = {
  id: number;
  address: string;
  address_detail: string;
  hours: string;
  hours_label: string;
  phone: string;
  phone_label: string;
};

export type SessionUser = { id: string; email?: string };
