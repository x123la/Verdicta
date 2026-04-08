import { LocalAiService } from './local-ai-service';
const service = new LocalAiService("/tmp");
console.log(service.getSystemProfile());
