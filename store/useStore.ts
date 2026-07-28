import { create } from 'zustand';
import { Room, Cabinet, Item, ActionLog, ItemWithPath, ActionLogWithItem } from '../types';
import * as db from '../lib/database';

interface AppState {
  rooms: Room[];
  cabinets: Record<string, Cabinet[]>;
  items: Record<string, Item[]>;
  searchResults: ItemWithPath[];
  actionLogs: ActionLogWithItem[];
  takenItems: ItemWithPath[];
  isLoading: boolean;

  loadRooms: () => Promise<void>;
  addRoom: (name: string, color?: string) => Promise<Room>;
  updateRoom: (room: Room) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;

  loadCabinets: (roomId: string) => Promise<void>;
  addCabinet: (data: Omit<Cabinet, 'id' | 'createdAt'>) => Promise<Cabinet>;
  updateCabinet: (id: string, cabinet: Cabinet) => Promise<void>;
  deleteCabinet: (id: string, roomId: string) => Promise<void>;

  loadItems: (cabinetId: string) => Promise<void>;
  addItem: (data: { cabinetId: string; name: string; quantity?: number; notes?: string; photoUri?: string | null; thumbnailUri?: string | null }) => Promise<Item>;
  updateItem: (id: string, item: Item) => Promise<void>;
  takeItem: (itemId: string) => Promise<void>;
  returnItem: (itemId: string) => Promise<void>;
  deleteItem: (id: string, cabinetId: string) => Promise<void>;

  search: (query: string) => Promise<void>;
  loadActionLogs: () => Promise<void>;
  loadTakenItems: () => Promise<void>;
  deleteActionLog: (id: string) => Promise<void>;
  refreshAll: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  rooms: [],
  cabinets: {},
  items: {},
  searchResults: [],
  actionLogs: [],
  takenItems: [],
  isLoading: false,

  loadRooms: async () => {
    const rooms = await db.getRooms();
    set({ rooms });
  },

  addRoom: async (name, color) => {
    const room = await db.addRoom(name, color);
    set({ rooms: [...get().rooms, room] });
    return room;
  },

  updateRoom: async (room) => {
    await db.updateRoom(room);
    set({
      rooms: get().rooms.map((r) => (r.id === room.id ? room : r)),
    });
  },

  deleteRoom: async (id) => {
    await db.deleteRoom(id);
    const { cabinets, items } = get();
    const newCabinets = { ...cabinets };
    const newItems = { ...items };
    Object.keys(newCabinets).forEach((key) => {
      if (key.startsWith(id)) delete newCabinets[key];
    });
    Object.keys(newItems).forEach((key) => {
      if (key.startsWith(id)) delete newItems[key];
    });
    set({
      rooms: get().rooms.filter((r) => r.id !== id),
      cabinets: newCabinets,
      items: newItems,
    });
  },

  loadCabinets: async (roomId) => {
    const list = await db.getCabinetsByRoom(roomId);
    set({ cabinets: { ...get().cabinets, [roomId]: list } });
  },

  addCabinet: async (data) => {
    const cabinet = await db.addCabinet(data);
    const roomId = data.roomId;
    const current = get().cabinets[roomId] || [];
    set({ cabinets: { ...get().cabinets, [roomId]: [...current, cabinet] } });
    return cabinet;
  },

  updateCabinet: async (id, cabinet) => {
    await db.updateCabinet(cabinet);
    const current = get().cabinets[cabinet.roomId] || [];
    set({
      cabinets: {
        ...get().cabinets,
        [cabinet.roomId]: current.map((c) => (c.id === id ? cabinet : c)),
      },
    });
  },

  deleteCabinet: async (id, roomId) => {
    await db.deleteCabinet(id);
    const current = get().cabinets[roomId] || [];
    set({ cabinets: { ...get().cabinets, [roomId]: current.filter((c) => c.id !== id) } });
  },

  loadItems: async (cabinetId) => {
    const list = await db.getItemsByCabinet(cabinetId);
    set({ items: { ...get().items, [cabinetId]: list } });
  },

  addItem: async (data) => {
    const item = await db.addItem(data);
    const cabinetId = data.cabinetId;
    const current = get().items[cabinetId] || [];
    set({ items: { ...get().items, [cabinetId]: [...current, item] } });
    return item;
  },

  updateItem: async (id, item) => {
    await db.updateItem(item);
    const cabinetId = item.cabinetId;
    const current = get().items[cabinetId] || [];
    set({
      items: {
        ...get().items,
        [cabinetId]: current.map((i) => (i.id === id ? item : i)),
      },
    });
  },

  takeItem: async (itemId) => {
    await db.takeItem(itemId);
    await get().loadActionLogs();
    await get().loadTakenItems();
    for (const cabinetId of Object.keys(get().items)) {
      const items = get().items[cabinetId];
      if (items.some((i) => i.id === itemId)) {
        await get().loadItems(cabinetId);
        break;
      }
    }
  },

  returnItem: async (itemId) => {
    await db.returnItem(itemId);
    await get().loadActionLogs();
    await get().loadTakenItems();
    for (const cabinetId of Object.keys(get().items)) {
      const items = get().items[cabinetId];
      if (items.some((i) => i.id === itemId)) {
        await get().loadItems(cabinetId);
        break;
      }
    }
  },

  deleteItem: async (id, cabinetId) => {
    await db.deleteItem(id);
    const current = get().items[cabinetId] || [];
    set({ items: { ...get().items, [cabinetId]: current.filter((i) => i.id !== id) } });
  },

  search: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    const results = await db.searchItems(query.trim());
    set({ searchResults: results });
  },

  loadActionLogs: async () => {
    const logs = await db.getActionLogs();
    set({ actionLogs: logs });
  },

  loadTakenItems: async () => {
    const items = await db.getTakenItems();
    set({ takenItems: items });
  },

  deleteActionLog: async (id) => {
    await db.deleteActionLog(id);
    set({ actionLogs: get().actionLogs.filter((l) => l.id !== id) });
  },

  refreshAll: async () => {
    set({ isLoading: true });
    await get().loadRooms();
    await get().loadActionLogs();
    await get().loadTakenItems();
    set({ isLoading: false });
  },
}));
