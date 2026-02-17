import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  connection: 'postgres',
  connections: {
    postgres: {
      client: 'pg',
      connection: env.get('DATABASE_URL')
        ? {
            connectionString: env.get('DATABASE_URL'),
            ssl: env.get('DB_SSL') ? { rejectUnauthorized: false } : undefined,
          }
        : {
            host: env.get('DB_HOST')!,
            port: env.get('DB_PORT')!,
            user: env.get('DB_USER')!,
            password: env.get('DB_PASSWORD'),
            database: env.get('DB_DATABASE')!,
            ssl: env.get('DB_SSL') ? { rejectUnauthorized: false } : undefined,
          },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig