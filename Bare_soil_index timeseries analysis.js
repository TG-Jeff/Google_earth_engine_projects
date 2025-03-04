/*The code below is an analysis of sbi values over th eperiod of 2018 to 2024
fro nakuru county implememnted in google earth engine*/



//imports 
var imageCollection = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
var table = ee.FeatureCollection("WM/geoLab/geoBoundaries/600/ADM1")

// Define the area of interest (nakuru)
var kenya = table.filter(ee.Filter.eq('shapeGroup', 'KEN'))
var nakuru = kenya.filter(ee.Filter.eq('shapeName','Nakuru'))

Map.centerObject(nakuru,9)
Map.addLayer(nakuru,{},'Nakuru bundary')

//define the dataset
var dataset = imageCollection.filterBounds(nakuru)
.filterDate('2018-01-01','2024-12-31')
.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',10))
.map(function(image){
  var img = image.select('B.*').multiply(0.0001)
  return img.copyProperties(image,image.propertyNames())
})
.map(function(image){
  var bsi = image.expression(
  '((RED + SWIR) - (NIR + BLUE)) / ((RED + SWIR) + (NIR + BLUE))', {
    'BLUE': image.select('B2'),
    'RED': image.select('B4'),
    'NIR': image.select('B8'),
    'SWIR': image.select('B11')
  }).rename('BSI')
  return image.addBands(bsi)
})
print(dataset.first())


var chart = ui.Chart.image.series({
  imageCollection:dataset.select('BSI'),
  region:nakuru, reducer:ee.Reducer.mean(), 
  scale:1000 }).setOptions({
  title:'Bare Soil Index time series',
  vAxis:{title:'Mean SVI Value'},
  hAxis:{title:'Date'},
  lineWidth:1,
  pointSize:2
})
//print(chart)

//display BSI change
var bsi2018 = dataset.select('BSI').filterDate('2018-01-01','2019-01-01').median()
var bsi2024 = dataset.select('BSI').filterDate('2024-01-01','2025-01-01').median()

var bsiChange = bsi2024.subtract(bsi2018).rename('BSI_CHANGE')

var image_2018 = dataset.filterDate('2018-01-01','2019-01-01').median()

Map.addLayer(image_2018.clip(nakuru),{min:0,max:0.3,bands:['B4','B3','B2']},'True color image 2018',false)
Map.addLayer(bsi2018.clip(nakuru),{min:-0.4,max:0.4,palette:['green','lightgreen','brown']},'BSI 2018',false)
Map.addLayer(bsi2024.clip(nakuru),{min:-0.4,max:0.4,palette:['green','lightgreen','brown']},'BSI 2024',false)
Map.addLayer(bsiChange.clip(nakuru),{palette:['green','yellow','red'],min:-0.4,max:0.4},'BSI change',false)

//export the results

// Export BSI Change Image to Google Drive
Export.image.toDrive({
  image: bsiChange,
  description: 'BSI_Change_2018_2024',
  scale: 10,
  region: nakuru,
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13
});




