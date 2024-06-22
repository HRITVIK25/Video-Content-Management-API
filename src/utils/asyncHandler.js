// we are creating a high order function for handling promis so we dont have to write big blocks of code everywhere
const asyncHandler = (requestHandler) => {
    (req,res,next) =>{
        Promise.resolve(requestHandler(req,res,next)).
        catch((err)=>next(err))
    }
}
// this is just another way of writing the try catch async handler 





export {asyncHandler}

// const asyncHandler = () => {}
// const asyncHandler = (fn) => async () => {} just recievibng function ko ek aur function mai pass kar diya jo async hai



// takes function as param
// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             sucess: false,
//             message: err.message
//         })
//     }
// }