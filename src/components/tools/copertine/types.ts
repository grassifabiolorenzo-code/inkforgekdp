export type FxEffect = "fx-none" | "fx-outline" | "fx-glow" | "fx-shadow";

export interface TextElementState {
  text: string;
  font: string;
  color: string;
  size: number;
  fx: FxEffect;
  top: number;
  left: number;
  align?: "left" | "center" | "right";
}

export interface SubtitleElementState extends TextElementState {
  id: string;
}

export interface ImageLayerState {
  id: string;
  src: string;
  name: string;
  width: number;
  top: number;
  left: number;
}

export interface BackgroundImageState {
  src: string;
  width: number;
  top: number;
  left: number;
}

export type TrimId = "8.5x11" | "6x9" | "8.25x11" | "8.5x8.5";
export type PaperType = "white" | "cream" | "color";
