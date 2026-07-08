import { RekognitionClient } from '@aws-sdk/client-rekognition'
import logger from './logger.js'

let rekognitionClient = null

const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env

if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
  try {
    rekognitionClient = new RekognitionClient({
      region: AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY
      }
    })
    logger.info('AWS Rekognition client successfully initialized.')
  } catch (error) {
    logger.error('Failed to initialize AWS Rekognition client:', error)
  }
} else {
  logger.warn('AWS credentials not fully configured. Rekognition Face Comparison will run in mock mode.')
}

export { rekognitionClient }
export default rekognitionClient
