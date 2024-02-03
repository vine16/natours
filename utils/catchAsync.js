module.exports = fn => {
  //this is the function that will be called by express, so it will pass three args
  return (req, res, next) => {
    // fn(req, res, next).catch(err => next(err));
    //even after returning, this fn will have access to "fn" => closures
    fn(req, res, next).catch(next); //directly pass err to next fn
  };
};
