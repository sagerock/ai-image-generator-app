import { ImageProvider } from './types';
import { OpenAIProvider } from './openai';
import { ReplicateProvider } from './replicate';
import { GoogleProvider } from './google';
import { Provider } from '../models/types';

// Lazy-initialize providers to avoid errors if API keys aren't set
const providers: Partial<Record<Provider, ImageProvider>> = {};

function getOrCreateProvider(name: Provider): ImageProvider {
  if (!providers[name]) {
    switch (name) {
      case 'openai':
        providers[name] = new OpenAIProvider();
        break;
      case 'replicate':
        providers[name] = new ReplicateProvider();
        break;
      case 'google':
        providers[name] = new GoogleProvider();
        break;
      default:
        throw new Error(`Unknown provider: ${name}`);
    }
  }
  return providers[name]!;
}

export function getProvider(name: Provider): ImageProvider {
  return getOrCreateProvider(name);
}

export * from './types';
