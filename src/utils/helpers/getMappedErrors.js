export function getMappedErrors(errors){
    let errorsParams = errors.errors?.map(er=>er.param);
    let errorsMapped = errors.mapped(); 
  
    return {errorsParams,errorsMapped}
  }