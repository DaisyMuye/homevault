import * as SQLite from 'expo-sqlite';
import { Room, Cabinet, Item, ActionLog, ItemWithPath, ActionLogWithItem } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('homevault.db');
    await initDb(db);
  }
  return db;
}

async function initDb(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      positionX REAL NOT NULL DEFAULT 0,
      positionY REAL NOT NULL DEFAULT 0,
      width REAL NOT NULL DEFAULT 150,
      height REAL NOT NULL DEFAULT 120,
      color TEXT NOT NULL DEFAULT '#FFE4B5',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cabinets (
      id TEXT PRIMARY KEY,
      roomId TEXT NOT NULL,
      name TEXT NOT NULL,
      photoUri TEXT,
      thumbnailUri TEXT,
      positionX REAL NOT NULL DEFAULT 0,
      positionY REAL NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (roomId) REFERENCES rooms(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      cabinetId TEXT NOT NULL,
      name TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      notes TEXT DEFAULT '',
      photoUri TEXT,
      thumbnailUri TEXT,
      status TEXT NOT NULL DEFAULT 'in_place',
      takenAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (cabinetId) REFERENCES cabinets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS action_logs (
      id TEXT PRIMARY KEY,
      itemId TEXT NOT NULL,
      action TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE
    );
  `);
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function now(): string {
  return new Date().toISOString();
}

// Rooms
export async function getRooms(): Promise<Room[]> {
  const database = await getDb();
  return await database.getAllAsync<Room>('SELECT * FROM rooms ORDER BY createdAt ASC');
}

export async function addRoom(name: string, color?: string): Promise<Room> {
  const database = await getDb();
  const roomColors = ['#FFE4B5', '#B5D8FF', '#FFB5C5', '#B5FFB5', '#FFD5B5', '#D5B5FF', '#FFFFB5', '#B5FFFF'];
  const rooms = await getRooms();
  const room: Room = {
    id: generateId(),
    name,
    positionX: 40 + (rooms.length % 3) * 180,
    positionY: 40 + Math.floor(rooms.length / 3) * 160,
    width: 150,
    height: 120,
    color: color || roomColors[rooms.length % roomColors.length],
    createdAt: now(),
  };
  await database.runAsync(
    'INSERT INTO rooms (id, name, positionX, positionY, width, height, color, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [room.id, room.name, room.positionX, room.positionY, room.width, room.height, room.color, room.createdAt]
  );
  return room;
}

export async function updateRoom(room: Room): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE rooms SET name = ?, positionX = ?, positionY = ?, width = ?, height = ?, color = ? WHERE id = ?',
    [room.name, room.positionX, room.positionY, room.width, room.height, room.color, room.id]
  );
}

export async function deleteRoom(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM rooms WHERE id = ?', [id]);
}

// Cabinets
export async function getCabinetsByRoom(roomId: string): Promise<Cabinet[]> {
  const database = await getDb();
  return await database.getAllAsync<Cabinet>(
    'SELECT * FROM cabinets WHERE roomId = ? ORDER BY createdAt ASC', [roomId]
  );
}

export async function addCabinet(data: Omit<Cabinet, 'id' | 'createdAt'>): Promise<Cabinet> {
  const database = await getDb();
  const cabinet: Cabinet = { ...data, id: generateId(), createdAt: now() };
  await database.runAsync(
    'INSERT INTO cabinets (id, roomId, name, photoUri, thumbnailUri, positionX, positionY, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [cabinet.id, cabinet.roomId, cabinet.name, cabinet.photoUri, cabinet.thumbnailUri, cabinet.positionX, cabinet.positionY, cabinet.createdAt]
  );
  return cabinet;
}

export async function updateCabinet(cabinet: Cabinet): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE cabinets SET name = ?, photoUri = ?, thumbnailUri = ?, positionX = ?, positionY = ? WHERE id = ?',
    [cabinet.name, cabinet.photoUri, cabinet.thumbnailUri, cabinet.positionX, cabinet.positionY, cabinet.id]
  );
}

export async function deleteCabinet(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM cabinets WHERE id = ?', [id]);
}

// Items
export async function getItemsByCabinet(cabinetId: string): Promise<Item[]> {
  const database = await getDb();
  return await database.getAllAsync<Item>(
    'SELECT * FROM items WHERE cabinetId = ? ORDER BY createdAt ASC', [cabinetId]
  );
}

export async function addItem(data: { cabinetId: string; name: string; quantity?: number; notes?: string; photoUri?: string | null; thumbnailUri?: string | null }): Promise<Item> {
  const database = await getDb();
  const timestamp = now();
  const item: Item = {
    id: generateId(),
    cabinetId: data.cabinetId,
    name: data.name,
    quantity: data.quantity || 1,
    notes: data.notes || '',
    photoUri: data.photoUri || null,
    thumbnailUri: data.thumbnailUri || null,
    status: 'in_place',
    takenAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await database.runAsync(
    'INSERT INTO items (id, cabinetId, name, quantity, notes, photoUri, thumbnailUri, status, takenAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [item.id, item.cabinetId, item.name, item.quantity, item.notes, item.photoUri, item.thumbnailUri, item.status, item.takenAt, item.createdAt, item.updatedAt]
  );
  return item;
}

export async function updateItem(item: Item): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE items SET name = ?, quantity = ?, notes = ?, photoUri = ?, thumbnailUri = ?, status = ?, takenAt = ?, updatedAt = ? WHERE id = ?',
    [item.name, item.quantity, item.notes, item.photoUri, item.thumbnailUri, item.status, item.takenAt, item.updatedAt, item.id]
  );
}

export async function takeItem(itemId: string): Promise<void> {
  const database = await getDb();
  const timestamp = now();
  await database.runAsync(
    "UPDATE items SET status = 'taken', takenAt = ?, updatedAt = ? WHERE id = ?",
    [timestamp, timestamp, itemId]
  );
  const log: ActionLog = {
    id: generateId(),
    itemId,
    action: 'take',
    timestamp,
  };
  await database.runAsync(
    'INSERT INTO action_logs (id, itemId, action, timestamp) VALUES (?, ?, ?, ?)',
    [log.id, log.itemId, log.action, log.timestamp]
  );
}

export async function returnItem(itemId: string): Promise<void> {
  const database = await getDb();
  const timestamp = now();
  await database.runAsync(
    "UPDATE items SET status = 'in_place', takenAt = NULL, updatedAt = ? WHERE id = ?",
    [timestamp, itemId]
  );
  const log: ActionLog = {
    id: generateId(),
    itemId,
    action: 'return',
    timestamp,
  };
  await database.runAsync(
    'INSERT INTO action_logs (id, itemId, action, timestamp) VALUES (?, ?, ?, ?)',
    [log.id, log.itemId, log.action, log.timestamp]
  );
}

export async function deleteItem(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM items WHERE id = ?', [id]);
}

// Search
export async function searchItems(query: string): Promise<ItemWithPath[]> {
  const database = await getDb();
  const likeQuery = `%${query}%`;
  return await database.getAllAsync<ItemWithPath>(
    `SELECT i.*, c.name AS cabinetName, c.roomId, r.name AS roomName, r.id AS roomId
     FROM items i
     JOIN cabinets c ON i.cabinetId = c.id
     JOIN rooms r ON c.roomId = r.id
     WHERE i.name LIKE ? OR i.notes LIKE ?
     ORDER BY i.updatedAt DESC`,
    [likeQuery, likeQuery]
  );
}

// Action Logs
export async function getActionLogs(): Promise<ActionLogWithItem[]> {
  const database = await getDb();
  return await database.getAllAsync<ActionLogWithItem>(
    `SELECT l.*, i.name AS itemName, c.name AS cabinetName, c.id AS cabinetId, r.name AS roomName, r.id AS roomId
     FROM action_logs l
     JOIN items i ON l.itemId = i.id
     JOIN cabinets c ON i.cabinetId = c.id
     JOIN rooms r ON c.roomId = r.id
     ORDER BY l.timestamp DESC`
  );
}

// Get all taken items (for profile page)
export async function getTakenItems(): Promise<ItemWithPath[]> {
  const database = await getDb();
  return await database.getAllAsync<ItemWithPath>(
    `SELECT i.*, c.name AS cabinetName, c.roomId, r.name AS roomName, r.id AS roomId
     FROM items i
     JOIN cabinets c ON i.cabinetId = c.id
     JOIN rooms r ON c.roomId = r.id
     WHERE i.status = 'taken'
     ORDER BY i.takenAt DESC`
  );
}

// Get item action history
export async function getItemHistory(itemId: string): Promise<ActionLog[]> {
  const database = await getDb();
  return await database.getAllAsync<ActionLog>(
    'SELECT * FROM action_logs WHERE itemId = ? ORDER BY timestamp DESC', [itemId]
  );
}

// Get item by id
export async function getItemById(itemId: string): Promise<Item | null> {
  const database = await getDb();
  return await database.getFirstAsync<Item>('SELECT * FROM items WHERE id = ?', [itemId]);
}

export async function deleteActionLog(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM action_logs WHERE id = ?', [id]);
}
