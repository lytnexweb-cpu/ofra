import type { HttpContext } from '@adonisjs/core/http'
import Note from '#models/note'
import Transaction from '#models/transaction'
import { createNoteValidator } from '#validators/note_validator'

export default class NotesController {
  async index({ params, response, auth }: HttpContext) {
    try {
      const transaction = await Transaction.query()
        .where('id', params.id)
        .where('owner_user_id', auth.user!.id)
        .firstOrFail()

      const notes = await Note.query()
        .where('transaction_id', transaction.id)
        .preload('author')
        .orderBy('created_at', 'desc')

      return response.ok({
        success: true,
        data: { notes },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: {
            message: 'Transaction not found',
            code: 'E_NOT_FOUND',
          },
        })
      }
      return response.internalServerError({
        success: false,
        error: {
          message: 'Failed to retrieve notes',
          code: 'E_INTERNAL_ERROR',
        },
      })
    }
  }

  async store({ params, request, response, auth }: HttpContext) {
    try {
      const transaction = await Transaction.query()
        .where('id', params.id)
        .where('owner_user_id', auth.user!.id)
        .firstOrFail()

      const payload = await request.validateUsing(createNoteValidator)
      const note = await Note.create({
        ...payload,
        transactionId: transaction.id,
        authorUserId: auth.user!.id,
      })

      await note.load('author')

      return response.created({
        success: true,
        data: { note },
      })
    } catch (error) {
      if (error.messages) {
        return response.unprocessableEntity({
          success: false,
          error: {
            message: 'Validation failed',
            code: 'E_VALIDATION_FAILED',
            details: error.messages,
          },
        })
      }
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: {
            message: 'Transaction not found',
            code: 'E_NOT_FOUND',
          },
        })
      }
      return response.internalServerError({
        success: false,
        error: {
          message: 'Failed to create note',
          code: 'E_INTERNAL_ERROR',
        },
      })
    }
  }

  async destroy({ params, response, auth }: HttpContext) {
    try {
      // Find the note
      const note = await Note.findOrFail(params.id)

      // Verify that the user owns the associated transaction
      await Transaction.query()
        .where('id', note.transactionId)
        .where('owner_user_id', auth.user!.id)
        .firstOrFail()

      // Delete the note
      await note.delete()

      return response.noContent()
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: {
            message: 'Note not found',
            code: 'E_NOT_FOUND',
          },
        })
      }
      return response.internalServerError({
        success: false,
        error: {
          message: 'Failed to delete note',
          code: 'E_INTERNAL_ERROR',
        },
      })
    }
  }
}
