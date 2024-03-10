# PRICE COMPARISON WEB APPLICATION

## Price Scraping Tool

## Project Proposal

- Coast Appliances
- Osman Saleem
- Harbaj Singh Grewal
- Jasmine Lea
- Michael Best
- Tarunjeev Juneja

## Abstract

In today's era, it is very hard for companies to provide the best sale price to consumers for a given product. Most of the companies rely on a price-matching policy that helps customers by matching the price of their competitors. The tool we are aiming to build can not only help Coast Appliances become more proactive of what their competitors are selling products for and make the decision of setting the price and get ahead of competition by strategizing ahead of time.

## Project Introduction/Overview

The desired final application will be able to crawl multiple competitor sites and compare the prices of products to those that Coast Appliances sell. The web-crawling data will be stored in a database with columns; price, SKU, date, and store name at a minimum. Price scraping will happen automatically on a schedule, once per day, or on demand at a restricted frequency to avoid over-trafficking the sites.

## Objectives

The main objective is to supply Coast Appliances with information on their competitors' prices and other useful data. This is achieved by crawling competitor sites and grabbing the relevant data and storing this information in a database. This will then allow the Coast Appliances sales team and other stakeholders to make decisions based on the information gathered.

## Sample Stories and Scenarios

Using the pricing tool, a new user can compare the prices of products that selected companies are selling for in the market. The user is not only able to find the cheapest price of a product but can also help users make a decision of how much they want to sell selected for in order to be on top of the market by making good profits.

## User Interface Description

The main page will show a table of all products and their related data obtained from crawling, and will allow the user to sort by specific criteria. Showing only those with higher or lower prices than Coast Appliances is an important sorting method that will be included.

A button to start a crawling routine on demand will be included, with options to crawl only specific sites as opposed to all four at once.

A search bar to find a specific item will be included.

A timestamp at the top of the data table showing when the data was last acquired, and when the next scheduled crawl will take place.

## Features

- Web-scraping multiple sites, including Coast Appliances, to get price, name, SKU, site name, and date data
- Database to store all the data collected by scraping the websites.
- Scheduled automatic crawling
- Button to start on demand crawling at a restricted frequency
- Filtering
  - Show all items with lower price than Coast Appliances
  - Show all items with higher price than Coast Appliances
- Search bar to find an item by SKU, showing results from all four stores.
- User sign up and login, which allows them to watchlist specific products they are interested in, and add related notes about the product for future reference.

## Specifications

The technologies that will be used are as follows:

- HTML / CSS - website design
- Node.js / JavaScript - website functionality and scripting
- PostgreSQL - database
- Heroku - hosting (only for production - Coast Appliances will host after completion of project)
- SERP API for crawling home depot
- BackyardAPI for crawling Lowes

## The Sites That Will Be Crawled Are as Follows

- Coast Appliances - https://www.coastappliances.ca/
- Trail Appliances - https://www.trailappliances.com/
- Home Depot - https://www.homedepot.ca/en/home.html
