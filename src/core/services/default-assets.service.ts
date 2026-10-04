import fs from "fs";
import path from "path";
import { WebhookLogger } from "../logger/webhook.logger";
import { FastLogger } from "../logger/logger";

export class DefaultAssetService {
  private static defaultPanelUrl: string | null = null;
  private static isUploading = false;
  private static localImagePath = path.join(process.cwd(), "src", "assets", "default_panel.jpg");

  public static async getDefaultPanelImageUrl(): Promise<string | null> {
    if (this.defaultPanelUrl) {
      return this.defaultPanelUrl;
    }

    if (this.isUploading) {
      return this.defaultPanelUrl;
    }

    this.isUploading = true;
    try {
      if (fs.existsSync(this.localImagePath)) {
        const buffer = fs.readFileSync(this.localImagePath);
        const uploadedUrl = await WebhookLogger.uploadImage(buffer, "default_panel_marlboro.jpg");
        if (uploadedUrl) {
          this.defaultPanelUrl = uploadedUrl;
          FastLogger.success(`Default panel image uploaded and cached: ${uploadedUrl}`);
          return this.defaultPanelUrl;
        }
      }
    } catch (err) {
      FastLogger.warn(`Failed to upload default panel image: ${err}`);
    } finally {
      this.isUploading = false;
    }

    return this.defaultPanelUrl;
  }

  public static getDefaultPanelImageSync(): string | null {
    return this.defaultPanelUrl;
  }

  public static setDefaultPanelImageUrl(url: string): void {
    this.defaultPanelUrl = url;
  }
}
