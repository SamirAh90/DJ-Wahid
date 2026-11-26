import { api } from '@/lib/api';

export type SiteEvent = {
  id: string;
  day_label: string;
  month_label: string;
  title: string;
  description: string;
  location: string;
  price: string;
  event_date: string | null;
  published: boolean;
};

export type SitePhoto = {
  used_on_site?: boolean;
  id: string;
  image_url: string;
  caption: string;
  likes: number;
  comments: number;
  sort_order: number;
  published: boolean;
};

export type LibraryMedia = {id:string;title:string;url:string;preview_url:string;type:"video"|"audio";used_on_site:boolean};
export type SiteContent = { events: SiteEvent[]; photos: SitePhoto[]; website?: import('@/lib/website').WebsiteSettings; library_initialized?: boolean; media_library?: LibraryMedia[] };

export type EventInput = {
  id?: string;
  day_label: string;
  month_label: string;
  title: string;
  description: string;
  location: string;
  price: string;
  event_date: string | null;
  published: boolean;
};

export type PhotoInput = {
  id?: string;
  image_url: string;
  caption: string;
  likes: number;
  comments: number;
  sort_order: number;
  published: boolean;
};

export const getSiteContent = () => api<SiteContent>('content');
export const getAdminContent = () => api<SiteContent>('admin-content');
export const saveEvent = ({ data }: { data: EventInput }) => api<{ id: string }>('save-event', data);
export const deleteEvent = ({ data }: { data: { id: string } }) => api<{ ok: boolean }>('delete-event', data);
export const savePhoto = ({ data }: { data: PhotoInput }) => api<{ id: string }>('save-photo', data);
export const deletePhoto = ({ data }: { data: { id: string; image_url: string } }) => api<{ ok: boolean }>('delete-photo', data);
