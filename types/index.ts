export interface Room {
  id: string;
  name: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  color: string;
  createdAt: string;
}

export interface Cabinet {
  id: string;
  roomId: string;
  name: string;
  photoUri: string | null;
  thumbnailUri: string | null;
  positionX: number;
  positionY: number;
  createdAt: string;
}

export interface Item {
  id: string;
  cabinetId: string;
  name: string;
  quantity: number;
  notes: string;
  photoUri: string | null;
  thumbnailUri: string | null;
  status: 'in_place' | 'taken';
  takenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActionLog {
  id: string;
  itemId: string;
  action: 'take' | 'return';
  timestamp: string;
}

export interface ItemWithPath extends Item {
  cabinetName: string;
  roomName: string;
  roomId: string;
  cabinetId: string;
}

export interface ActionLogWithItem extends ActionLog {
  itemName: string;
  cabinetName: string;
  roomName: string;
  roomId: string;
  cabinetId: string;
}

export interface TakenItem extends Item {
  cabinetName: string;
  roomName: string;
  roomId: string;
  cabinetId: string;
}
