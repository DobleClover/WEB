const fetch = require('node-fetch');

const controller = {
    index: (req,res)=>{
        return res.render('index.ejs')
    }
};

module.exports = controller;