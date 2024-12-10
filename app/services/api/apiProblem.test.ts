import type { ApiErrorResponse } from 'apisauce'
import { getGeneralApiProblem } from './apiProblem'

it('handles connection errors', () => {
  expect(getGeneralApiProblem({ problem: 'CONNECTION_ERROR' } as ApiErrorResponse<null>)).toEqual({
    kind: 'cannot-connect',
    temporary: true,
  })
})

it('handles network errors', () => {
  expect(getGeneralApiProblem({ problem: 'NETWORK_ERROR' } as ApiErrorResponse<null>)).toEqual({
    kind: 'cannot-connect',
    temporary: true,
  })
})

it('handles timeouts', () => {
  expect(getGeneralApiProblem({ problem: 'TIMEOUT_ERROR' } as ApiErrorResponse<null>)).toEqual({
    kind: 'timeout',
    temporary: true,
  })
})

it('handles server errors', () => {
  expect(getGeneralApiProblem({ problem: 'SERVER_ERROR' } as ApiErrorResponse<null>)).toEqual({
    kind: 'server',
  })
})

it('handles unknown errors', () => {
  expect(getGeneralApiProblem({ problem: 'UNKNOWN_ERROR' } as ApiErrorResponse<null>)).toEqual({
    kind: 'unknown',
    temporary: true,
  })
})

it('handles unauthorized errors', () => {
  expect(
    getGeneralApiProblem({ problem: 'CLIENT_ERROR', status: 401 } as ApiErrorResponse<null>),
  ).toEqual({
    kind: 'unauthorized',
  })
})

it('handles forbidden errors', () => {
  expect(
    getGeneralApiProblem({ problem: 'CLIENT_ERROR', status: 403 } as ApiErrorResponse<null>),
  ).toEqual({
    kind: 'forbidden',
  })
})

it('handles not-found errors', () => {
  expect(
    getGeneralApiProblem({ problem: 'CLIENT_ERROR', status: 404 } as ApiErrorResponse<null>),
  ).toEqual({
    kind: 'not-found',
  })
})

it('handles other client errors', () => {
  expect(
    getGeneralApiProblem({ problem: 'CLIENT_ERROR', status: 418 } as ApiErrorResponse<null>),
  ).toEqual({
    kind: 'rejected',
  })
})

it('handles cancellation errors', () => {
  expect(getGeneralApiProblem({ problem: 'CANCEL_ERROR' } as ApiErrorResponse<null>)).toBeNull()
})
