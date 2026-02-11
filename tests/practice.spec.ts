import {expect, test, Locator} from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.beforeEach('Homepage', async({page})=>{
    await page.goto('https://demoapps.qspiders.com/ui?scenario=1')
})

test('TextBox',async({page})=>{
    await page.locator('#name').fill('Vinayak') 
    await page.locator('[name="email"]').type('test@gmail.com')
    await page.getByLabel('Password').fill('test123')
    await page.getByRole('button',{name:"Register"}).click()
    await expect(page.getByRole('status').first()).toHaveText('Registered successfully')
    //await expect(page.locator('[role="status"]').first()).toHaveText('Registered successfully')
    
})

test('button',async({page})=>{
    await page.locator('[href="/ui/button"]').click()
    await page.getByRole('button',{name:'Yes'}).click()
    await page.locator('a:text("Right Click")').click()
    await page.getByRole('button',{name: "Right Click"}).click({button:'right'})
    await page.locator('.origin-top-right :text-is("Yes")').click()
    await page.locator('a:text("Double Click")').click()
    await page.getByRole('button',{name:'Yes'}).dblclick()
    await page.locator('a:text("Submit Click")').click()
    await page.locator('[type="radio"][value="Yes"]').check()
    await page.getByRole('button',{name:'Submit'}).click()
    await page.locator('a:text("Disabled")').click()
    await page.getByRole('checkbox').click({force:true})
})

test('Lniks',async({page,context})=>{
    await page.locator('[href="/ui/link"]').click() 
    await page.getByRole('link',{name:"Men",exact: true}).click()
    await page.locator('a:text("Link in New Tab")').click()
    
    const pagePromise = context.waitForEvent('page')
    await page.getByRole('link',{name:"Men",exact: true}).click()
    const newTab = await pagePromise
    await newTab.waitForLoadState()
    await expect(newTab).toHaveURL('https://demoapps.qspiders.com/ui/link/linkNew/men')

    await page.locator('a:text("Broken Links")').click()
    await page.getByRole('link',{name:"Kids",exact: true}).click()
    await expect(page.locator('p:text-is("Page not found")')).toBeVisible({timeout:20000})
})

test('Popups', async({page,context})=>{
    await page.locator('section:text-is("Popups")').click()
    await page.locator('[href="/ui/alert"]').click()
    const targetRow = await page.getByRole('row',{name : "Levis Shirt"})
    await targetRow.getByRole('checkbox').click()
    page.on('dialog', dialog => dialog.accept())
    await page.locator('#deleteButton').click() 

    // await page.locator('a:text("Prompt")').click()
    // const targetRow1 = await page.getByRole('row',{name : "Levis Shirt"})
    // await targetRow1.getByRole('checkbox').click()
    // page.on('dialog', dialog => dialog.accept('This is vinayak'))
    // await page.locator('#deleteButton').click()
    
    await page.locator('[href="/ui/hidden"]').click()
    await page.getByRole('button',{name : "Add Customer"}).click()
    const form = await page.locator('article form')
    await form.locator('#customerName').fill('Ram')
    await form.locator('#customerEmail').fill('Test@gmail.com')
    await form.getByLabel('Product').selectOption('Mobile')
    await form.locator('#message').fill('Test')
    await form.getByRole('button',{name:"Submit"}).click()

    await page.locator('[href="/ui/browser"]').click()
    //const item = await page.locator('div :text-is("Watches")')
    
    const pagePromise = context.waitForEvent('page')
    await page.getByText("view more").first().click()
    const newTab = await pagePromise
    await newTab.waitForLoadState()
    await expect(newTab).toHaveTitle('Demoapps - Luxury Watch')
    await newTab.close()
})

test('Basic Auth in new tab using httpCredentials', async ({ browser }) => {

  // Create a new context with basic auth credentials
  const context = await browser.newContext({
    httpCredentials: {
      username: 'admin',
      password: 'admin'
    }
  });

  const page = await context.newPage();
  await page.goto('https://demoapps.qspiders.com/ui?scenario=1')
  await page.locator('section:text-is("Popups")').click()
  await page.locator('[href="/ui/auth"]').click()

  // Click link that opens in new tab
  const [newPage] = await Promise.all([
    context.waitForEvent('page'),
    await page.locator('#AuthLink').click()
  ]);

  // Wait for the new tab to load
  await newPage.waitForLoadState();

  // Validate successful login
  await expect(newPage.locator('p')).toHaveText(
    'congratulations with valid credentials'
  );
});

test('File Upload',async({page})=>{
  await page.locator('section:text-is("Popups")').click()
  await page.locator('[href="/ui/fileUpload"]').click()
  await page.setInputFiles('input[type="file"]','./testData/Sample.pdf')
  
  await page.locator('[href="/ui/download"]').click()
  await page.getByPlaceholder('Enter text here').fill('Test Data By Vinayak')
  const downloadPromise = page.waitForEvent('download')
  await page.locator('#downloadButton').click()
  const download = await downloadPromise
  await download.saveAs('./testData/Sample.txt')
  expect(fs.existsSync('./testData/Sample.txt')).toBeTruthy();
})

test('Handle browser notification', async ({ browser }) => {

  const context = await browser.newContext({
    permissions: ['notifications']   // allow notifications
  });

  const page = await context.newPage();

  await page.goto('https://demoapps.qspiders.com/ui?scenario=1')
  await page.locator('section:text-is("Popups")').click()
  await page.locator('[href="/ui/browserNot"]').click()
  
  await page.locator('#browNotButton').click()

  // Validate something after permission is granted
  //await expect(page.locator('#status')).toHaveText('Notifications enabled')
});

test('drag element by specific pixels', async ({ page }) => {
  // First, navigate to a page with a draggable element
  await page.locator('section:text-is("Mouse Actions")').click()
  await page.locator('[href="/ui/dragDrop"]').click()

  const sourceElement = await page.locator(':text-is("Drag Me")');
  // Get the bounding box of the source element to determine starting coordinates
  const sourceBox = await sourceElement.boundingBox();

  if (sourceBox) {
    // Start the drag action from the center of the source element
    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.mouse.down();

    // Move the mouse by a specific pixel offset (e.g., 100 pixels right and 50 pixels down)
    const targetX = sourceBox.x + sourceBox.width / 2 + 100;
    const targetY = sourceBox.y + sourceBox.height / 2 + 50;

    await page.mouse.move(targetX, targetY); // Drag to the new coordinates
    await page.mouse.up(); // Release the mouse button to complete the drop

    // Add assertions here to verify the element's new position or a success message
  } else {
    console.error('Source element bounding box not found.');
  }
  
});

test('DragAndDrop',async({page})=>{
  await page.locator('section:text-is("Mouse Actions")').click()
  await page.locator('[href="/ui/dragDrop"]').click()
  await page.locator('a:text("Drag Position")').click()
  await page.locator(':text-is("Mobile Charger")').dragTo(page.locator('.drop-column').first())
  await page.locator('[href="/ui/mouseHover"]').click()
  await page.locator('[src="/assets/message-hint-nbRmWGWf.png"]').hover()
  const navLinks: Locator[] = await page.locator('[class="p-4"]').all();
  for (const linkLocator of navLinks) {
    const linkText = await linkLocator.textContent();
    console.log(`Link Text: ${linkText} `);
    console.log('=======================');
  }
})

test('Scroll',async({page,context})=>{
  await page.locator('section:text-is("Scroll")').click()
  await page.locator('[href="/ui/scroll"]').click()
  const pagePromise = context.waitForEvent('page')
  await page.locator('a:text-is("Open In New Tab")').click()
  const newTab = await pagePromise
  await newTab.waitForLoadState()
  const element = await newTab.locator(':text-is("8. Complaints")')
  //await newTab.evaluate(()=>window.scrollBy(0,500))
  //await page.mouse.wheel(0, 1000);
  await element.scrollIntoViewIfNeeded()
  await element.click()
  
})