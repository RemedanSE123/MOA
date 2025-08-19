-- Verify the structure of both tables
SELECT 'region table structure:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'region' 
ORDER BY ordinal_position;

SELECT 'r_weather_data table structure:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'r_weather_data' 
ORDER BY ordinal_position;

-- Check sample data
SELECT 'Sample region data:' as info;
SELECT gid, adm1_en, adm1_pcode, adm0_en 
FROM region 
LIMIT 5;

SELECT 'Sample weather data for 2020:' as info;
SELECT id, adm1_en, adm1_pcode, year, avg_annual_max_temperature_c 
FROM r_weather_data 
WHERE year = 2020 
LIMIT 5;

-- Check data availability by year
SELECT 'Weather data by year:' as info;
SELECT year, COUNT(*) as region_count 
FROM r_weather_data 
GROUP BY year 
ORDER BY year;
