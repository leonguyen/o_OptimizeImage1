import tinify from "tinify";
import { apiKeyManager } from "./apiKeyManager";

export class TinyPNGService {
  async compressImage(buffer: Buffer): Promise<{ compressedBuffer: Buffer; originalSize: number; compressedSize: number }> {
    console.log(`Starting image compression for ${Math.round(buffer.length / 1024)}KB image...`);
    
    const apiKey = await apiKeyManager.getNextAvailableKey();
    
    if (!apiKey) {
      console.error("No available API keys for compression");
      throw new Error("No available API keys. All keys have reached their monthly limit.");
    }

    console.log(`Setting TinyPNG API key: ${apiKey.substring(0, 8)}...`);
    tinify.key = apiKey;
    
    try {
      // First validate the key to ensure it's working
      await tinify.validate();
      console.log("API key validated successfully");
      
      const originalSize = buffer.length;
      console.log(`Processing ${originalSize} byte image`);
      
      const source = tinify.fromBuffer(buffer);
      const compressedData = await source.toBuffer();
      const compressedBuffer = Buffer.from(compressedData);
      const compressedSize = compressedBuffer.length;
      
      const savings = ((originalSize - compressedSize) / originalSize) * 100;
      console.log(`Compression completed: ${originalSize} -> ${compressedSize} bytes (${savings.toFixed(1)}% savings)`);

      // Record usage for this API key
      await apiKeyManager.recordUsage(apiKey);

      return {
        compressedBuffer,
        originalSize,
        compressedSize,
      };
    } catch (error: any) {
      console.error(`TinyPNG compression error:`, error);
      
      if (error instanceof tinify.AccountError) {
        throw new Error(`TinyPNG account error: ${error.message}`);
      } else if (error instanceof tinify.ClientError) {
        throw new Error(`TinyPNG client error: ${error.message}`);
      } else if (error instanceof tinify.ServerError) {
        throw new Error(`TinyPNG server error: ${error.message}`);
      } else if (error instanceof tinify.ConnectionError) {
        throw new Error(`TinyPNG connection error: ${error.message}`);
      } else {
        throw new Error(`TinyPNG compression failed: ${error.message}`);
      }
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      tinify.key = apiKey;
      await tinify.validate();
      return true;
    } catch (error) {
      return false;
    }
  }

  async getCompressionCount(apiKey: string): Promise<number> {
    try {
      tinify.key = apiKey;
      await tinify.validate();
      return tinify.compressionCount || 0;
    } catch (error) {
      return 0;
    }
  }
}

export const tinyPNGService = new TinyPNGService();
