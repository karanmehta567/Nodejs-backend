import express from 'express'


export const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next)
    } catch (error) {
        console.log('error occured', error)
        res.status(500).json({
            message: 'Internal server error'
        })
    }
}