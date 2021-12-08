// dbPassword = 'mongodb+srv://lexxluey:'+ encodeURIComponent('Colo_3166') + '@ravecluster.5pp1z.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
// mongodb+srv://lexxluey:<password>@bravecluster.5pp1z.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
module.exports = {
    mongoURI: process.env.MONGOURI
};
