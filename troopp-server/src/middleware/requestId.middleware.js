import { randomUUID } from 'crypto'

/**
 * Middleware to append a unique ID to every incoming HTTP request.
 * Useful for request correlation and tracking logs in production.
 */
const requestIdMiddleware = (req, res, next) => {
  const reqId = req.headers['x-request-id'] || randomUUID()
  req.id = reqId
  res.setHeader('x-request-id', reqId)
  next()
}

export default requestIdMiddleware
