//let's make these queries reusable
//1. kiske upar krna chahte ho query => query object(initially set to extract all docs)
//2. query kya hai
class APIFeatures {
  //query object, queryString(obj, from req.query)
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    //1. Filtering
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    //2. Advanced Filtering
    let querystr = JSON.stringify(queryObj);
    //b => boundary anchor, ensures that there are no prefix and suffix
    //g => global, i.e. select all matching results and not just first
    querystr = querystr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    this.query = this.query.find(JSON.parse(querystr));
    return this; //object, to chain methods
  }

  sort() {
    //3. Sort the results
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      let fields = this.queryString.fields.split(','); //return an array
      // Separate included and excluded fields
      const includedFields = fields
        .filter(field => !field.startsWith('-'))
        .join(' ');

      const excludedFields = fields
        .filter(field => field.startsWith('-'))
        .map(field => field.slice(1));

      // Handle inclusion
      if (includedFields) {
        this.query = this.query.select(includedFields);
      } else {
        // Handle exclusion
        this.query = this.query.select('-__v');
      }

      // Handle exclusion
      //sum += arr[i]
      if (excludedFields.length > 0) {
        excludedFields.forEach(field => {
          this.query = this.query.select(`-${field}`);
        });
      }
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    //4. Pagination
    const page = this.queryString.page * 1 || 1; //page number
    const limit = this.queryString.limit * 1 || 100; //entries per page
    const skip = (page - 1) * limit; //skip this many docs before collecting result

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
