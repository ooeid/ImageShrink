const path = require('path')
const os = require('os')
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron')
const imagemin = require('imagemin')
const imageminMozjpeg = require('imagemin-mozjpeg')
const imageminPngquant = require('imagemin-pngquant')
const slash = require('slash')
const log = require('electron-log')

// Set env
process.env.NODE_ENV = 'production'

const isDev = process.env.NODE_ENV !== 'production' ? true : false
const isMac = process.platform === 'darwin' ? true : false

let mainWindow
let aboutWindow

function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: 'ImageShrink',
    width: isDev ? 800 : 500,
    height: 600,
    icon: `${__dirname}/app/icons8-crop-64.png`,
    resizable: isDev ? true : false,
    backgroundColor: 'white',
    webPreferences: {
      nodeIntegration: true,
    },
  })

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.loadFile('./app/index.html')
}

function createAboutWindow() {
  aboutWindow = new BrowserWindow({
    title: 'About ImageShrink',
    width: 300,
    height: 300,
    icon: `${__dirname}/assets/icons/Icon_256x256.png`,
    resizable: false,
    backgroundColor: 'white',
  })

  aboutWindow.loadFile('./app/about.html')
}

app.on('ready', () => {
  createMainWindow()

  const mainMenu = Menu.buildFromTemplate(menu)
  Menu.setApplicationMenu(mainMenu)

  mainWindow.on('ready', () => (mainWindow = null))
})

const menu = 
[
    {
     label:'GitHub',
     click: async () => await shell.openExternal('')
    },
    {
    label:'About',
    click: createAboutWindow
    },
    {
        label:'Close/Ctrl + W', 
        accelerator: 'Ctrl+W',
        click: () => app.quit()
    }
]

ipcMain.on('image:minimize', (e, options) => {
  options.dest = path.join(os.homedir(), 'Desktop')
  shrinkImage(options)
})

async function shrinkImage({ imgPath, quality, dest }) {
  try {
    const pngQuality = quality / 100

    const files = await imagemin([slash(imgPath)], {
      destination: dest,
      plugins: [
        imageminMozjpeg({ quality }),
        imageminPngquant({
          quality: [pngQuality, pngQuality],
        }),
      ],
    })

    log.info(files)

//     Changed from shell.openItem() for v9
    shell.openPath(dest)

    mainWindow.webContents.send('image:done')
  } catch (err) {
    log.error(err)
  }
}

app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})

app.allowRendererProcessReuse = true