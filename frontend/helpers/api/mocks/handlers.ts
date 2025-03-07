import { MockedRequest, rest } from "msw"
import { baseURL, LoginCredentials, NewUser } from ".."
import FakeAuth from "./fake-auth"

type Json = Record<string, any>

const auth = new FakeAuth()

export const handlers = [
  rest.post<Json>(routePath("/auth/login"), (req, res, ctx) => {
    const token = auth.login(req.body as LoginCredentials)
    if (token) {
      return res(ctx.status(200), ctx.json({ access_token: token }))
    }
    return res(ctx.status(401))
  }),

  rest.post<Json>(routePath("/auth/register"), (req, res, ctx) => {
    const token = auth.register(req.body as NewUser)
    if (!token) {
      return res(ctx.status(400), ctx.json({ message: "email matches existing account" }))
    }
    return res(ctx.status(200), ctx.json({ access_token: token }))
  }),

  rest.get(routePath("/auth/test"), (req, res, ctx) => {
    const token = req.headers.get("Authorization")?.match(/^Bearer (?<token>.*)$/)?.groups?.token
    const user = token && auth.whoami(token)

    if (!user) {
      return res(ctx.status(401))
    }

    return res(
      ctx.status(200),
      ctx.json({
        active: user.active,
        email: user.email,
        email_confirmed_at: user.emailConfirmedAt,
        first_name: user.firstName,
        last_name: user.lastName
      })
    )
  })
]

/** Require that all API requests to our backend be handled. */
export function rejectUnhandledApiRequests(req: MockedRequest) {
  const url = req.url.href
  if (url.startsWith(baseURL)) {
    throw new Error("Unhandled API request! " + url)
  }
}

/** Returns the absolute URL for the relative path */
export function routePath(relative: string) {
  return `${baseURL}${relative}`
}
