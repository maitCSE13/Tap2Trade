const Product = require("../models/product");
const User = require("../models/user");
const slugify = require("slugify");

const pup = require("puppeteer");

async function getPrices(data) {
  let browser = await pup.launch({
    headless: true,
    defaultViewport: false,
    args: ["--start-maximized"],
  });

  let pages = await browser.pages();
  let res = await comparePrices(data, await browser.newPage());
  await browser.close();
  return res;
}
async function comparePrices(product, tab) {
  try {
    await tab.goto(`https://www.smartprix.com/products/?q=${product}`);
    await tab.waitForSelector("a.button.shop", { visible: true });
    let btn = await tab.$("a.button.shop")
    let link = await tab.evaluate(function (ele) {
      return ele.getAttribute("href");
    }, btn);
    await tab.goto(`https://www.smartprix.com${link}`)
    // let dbox = await tab.waitForSelector("#full-specs.spec-box")
    // let desc = await tab.evaluate(function (ele) {
    //   return ele.innerHTML;
    // }, dbox);
    await tab.waitForSelector("#compare-prices td.store-logo");
    let elem = await tab.$$("#compare-prices td.store-logo")
    let allstores = [];
    for(const ele of elem){
      let rowlist = await tab.evaluate(ele =>{
        return {"sname": ele.querySelector("a").getAttribute("title") ,"link": ele.querySelector("a").getAttribute("href") , "price" : ele.parentElement.children[3].textContent.split(" ")[0].substring(1).replaceAll(",","") };
      },ele)
      allstores.push(rowlist)
    };
    await tab.close();
    return allstores;
  } catch (err) {
    tab.close();
    return [];
  }
}
async function initData(data) {
  let browser = await pup.launch({
    headless: true,
    defaultViewport: false,
    args: ["--start-maximized"],
  });

  let pages = await browser.pages();
  let res = await getData(data, await browser.newPage());
  await browser.close();
  return res;
}
async function getData(product, tab) {
  try {
    await tab.goto(`https://www.smartprix.com/products/?q=${product}`);
    await tab.waitForSelector("a.button.shop", { visible: true });
    let btn = await tab.$("a.button.shop")
    let link = await tab.evaluate(function (ele) {
      return ele.getAttribute("href");
    }, btn);
    await tab.goto(`https://www.smartprix.com${link}`)
    let dbox = await tab.waitForSelector("#full-specs.spec-box")
    let desc = await tab.evaluate(function (ele) {
      return ele.innerHTML;
    }, dbox);
    await tab.waitForSelector("#compare-prices td.store-logo");
    let elem = await tab.$$("#compare-prices td.store-logo")
    let allstores = [];
    for(const ele of elem){
      let rowlist = await tab.evaluate(ele =>{
        return {"sname": ele.querySelector("a").getAttribute("title") ,"link": ele.querySelector("a").getAttribute("href") , "price" : ele.parentElement.children[3].textContent.split(" ")[0].substring(1).replaceAll(",","") };
      },ele)
      allstores.push(rowlist)
    };
    await tab.close();
    return {"prices": allstores, "desc": desc};
  } catch (err) {
    tab.close();
    return [];
  }
}
exports.create = async (req, res) => {
  try {
    let data = await initData(req.body.title)
    let prices = data["prices"];
    prices.push({sname: 'Tap2Trade', price: req.body.price, link: undefined})
    prices.sort((a, b) => a.price.localeCompare(b.price))
    req.body.cprices = prices;
    req.body.dtable = data["desc"];
    req.body.slug = slugify(req.body.title);
    const newProduct = await new Product(req.body).save();
    newProduct
    res.json(newProduct);
  } catch (err) {
    console.log(err);
    // res.status(400).send("Create product failed");
    res.status(400).json({
      err: err.message,
    });
  }
};

exports.listAll = async (req, res) => {
  let products = await Product.find({})
    .limit(parseInt(req.params.count))
    .populate("category")
    .populate("subs")
    .sort([["createdAt", "desc"]])
    .exec();
  res.json(products);
};

exports.remove = async (req, res) => {
  try {
    const deleted = await Product.findOneAndRemove({
      slug: req.params.slug,
    }).exec();
    res.json(deleted);
  } catch (err) {
    console.log(err);
    return res.staus(400).send("Product delete failed");
  }
};

exports.read = async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug })
    .populate("category")
    .populate("subs")
    .exec();
  res.json(product);
};

exports.update = async (req, res) => {
  try {
    if (req.body.title) {
      let prices = await getPrices(req.body.title)
      prices.push({sname: 'Tap2Trade', price: req.body.price, link: undefined})
      prices.sort((a,b) => (a.price > b.price) ? 1 : ((b.price > a.price) ? -1 : 0))
      req.body.cprices = prices;
      req.body.slug = slugify(req.body.title);
    }
    const updated = await Product.findOneAndUpdate(
      { slug: req.params.slug },
      req.body,
      { new: true }
    ).exec();
    res.json(updated);
  } catch (err) {
    console.log("PRODUCT UPDATE ERROR ----> ", err);
    // return res.status(400).send("Product update failed");
    res.status(400).json({
      err: err.message,
    });
  }
};

// WITHOUT PAGINATION
// exports.list = async (req, res) => {
//   try {
//     // createdAt/updatedAt, desc/asc, 3
//     const { sort, order, limit } = req.body;
//     const products = await Product.find({})
//       .populate("category")
//       .populate("subs")
//       .sort([[sort, order]])
//       .limit(limit)
//       .exec();

//     res.json(products);
//   } catch (err) {
//     console.log(err);
//   }
// };

// WITH PAGINATION
exports.list = async (req, res) => {
  // console.table(req.body);
  try {
    // createdAt/updatedAt, desc/asc, 3
    const { sort, order, page } = req.body;
    const currentPage = page || 1;
    const perPage = 3; // 3

    const products = await Product.find({})
      .skip((currentPage - 1) * perPage)
      .populate("category")
      .populate("subs")
      .sort([[sort, order]])
      .limit(perPage)
      .exec();

    res.json(products);
  } catch (err) {
    console.log(err);
  }
};

exports.productsCount = async (req, res) => {
  let total = await Product.find({}).estimatedDocumentCount().exec();
  res.json(total);
};

exports.productStar = async (req, res) => {
  const product = await Product.findById(req.params.productId).exec();
  const user = await User.findOne({ email: req.user.email }).exec();
  const { star } = req.body;

  // who is updating?
  // check if currently logged in user have already added rating to this product?
  let existingRatingObject = product.ratings.find(
    (ele) => ele.postedBy.toString() === user._id.toString()
  );

  // if user haven't left rating yet, push it
  if (existingRatingObject === undefined) {
    let ratingAdded = await Product.findByIdAndUpdate(
      product._id,
      {
        $push: { ratings: { star, postedBy: user._id } },
      },
      { new: true }
    ).exec();
    console.log("ratingAdded", ratingAdded);
    res.json(ratingAdded);
  } else {
    // if user have already left rating, update it
    const ratingUpdated = await Product.updateOne(
      {
        ratings: { $elemMatch: existingRatingObject },
      },
      { $set: { "ratings.$.star": star } },
      { new: true }
    ).exec();
    console.log("ratingUpdated", ratingUpdated);
    res.json(ratingUpdated);
  }
};

exports.listRelated = async (req, res) => {
  const product = await Product.findById(req.params.productId).exec();

  const related = await Product.find({
    _id: { $ne: product._id },
    category: product.category,
  })
    .limit(3)
    .populate("category")
    .populate("subs")
    .populate("postedBy")
    .exec();

  res.json(related);
};

// SERACH / FILTER

const handleQuery = async (req, res, query) => {
  const products = await Product.find({ $text: { $search: query } })
    .populate("category", "_id name")
    .populate("subs", "_id name")
    .populate("postedBy", "_id name")
    .exec();

  res.json(products);
};

const handlePrice = async (req, res, price) => {
  try {
    let products = await Product.find({
      price: {
        $gte: price[0],
        $lte: price[1],
      },
    })
      .populate("category", "_id name")
      .populate("subs", "_id name")
      .populate("postedBy", "_id name")
      .exec();

    res.json(products);
  } catch (err) {
    console.log(err);
  }
};

const handleCategory = async (req, res, category) => {
  try {
    let products = await Product.find({ category })
      .populate("category", "_id name")
      .populate("subs", "_id name")
      .populate("postedBy", "_id name")
      .exec();

    res.json(products);
  } catch (err) {
    console.log(err);
  }
};

const handleStar = (req, res, stars) => {
  Product.aggregate([
    {
      $project: {
        document: "$$ROOT",
        // title: "$title",
        floorAverage: {
          $floor: { $avg: "$ratings.star" }, // floor value of 3.33 will be 3
        },
      },
    },
    { $match: { floorAverage: stars } },
  ])
    .limit(12)
    .exec((err, aggregates) => {
      if (err) console.log("AGGREGATE ERROR", err);
      Product.find({ _id: aggregates })
        .populate("category", "_id name")
        .populate("subs", "_id name")
        .populate("postedBy", "_id name")
        .exec((err, products) => {
          if (err) console.log("PRODUCT AGGREGATE ERROR", err);
          res.json(products);
        });
    });
};

const handleSub = async (req, res, sub) => {
  const products = await Product.find({ subs: sub })
    .populate("category", "_id name")
    .populate("subs", "_id name")
    .populate("postedBy", "_id name")
    .exec();

  res.json(products);
};

const handleShipping = async (req, res, shipping) => {
  const products = await Product.find({ shipping })
    .populate("category", "_id name")
    .populate("subs", "_id name")
    .populate("postedBy", "_id name")
    .exec();

  res.json(products);
};

const handleColor = async (req, res, color) => {
  const products = await Product.find({ color })
    .populate("category", "_id name")
    .populate("subs", "_id name")
    .populate("postedBy", "_id name")
    .exec();

  res.json(products);
};

const handleBrand = async (req, res, brand) => {
  const products = await Product.find({ brand })
    .populate("category", "_id name")
    .populate("subs", "_id name")
    .populate("postedBy", "_id name")
    .exec();

  res.json(products);
};

exports.searchFilters = async (req, res) => {
  const {
    query,
    price,
    category,
    stars,
    sub,
    shipping,
    color,
    brand,
  } = req.body;

  if (query) {
    console.log("query --->", query);
    await handleQuery(req, res, query);
  }

  // price [20, 200]
  if (price !== undefined) {
    console.log("price ---> ", price);
    await handlePrice(req, res, price);
  }

  if (category) {
    console.log("category ---> ", category);
    await handleCategory(req, res, category);
  }

  if (stars) {
    console.log("stars ---> ", stars);
    await handleStar(req, res, stars);
  }

  if (sub) {
    console.log("sub ---> ", sub);
    await handleSub(req, res, sub);
  }

  if (shipping) {
    console.log("shipping ---> ", shipping);
    await handleShipping(req, res, shipping);
  }

  if (color) {
    console.log("color ---> ", color);
    await handleColor(req, res, color);
  }

  if (brand) {
    console.log("brand ---> ", brand);
    await handleBrand(req, res, brand);
  }
};
