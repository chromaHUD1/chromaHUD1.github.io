# Edit and save your portfolio

Double-click dist/Edit Website.cmd. It opens the visual editor at http://127.0.0.1:8765/editor.html and enables direct saving.

Edit using Home, Cube, Projects, and Style. Preview page switches between About, Projects, and individual project pages. Each project supports detailed text sections, photos, and code blocks.

On Cube, or within a project under Projects, expand Main headline image, Motivation, Photo slideshow, Videos, or Parts list. Other projects also have Engineering details; the cube has its existing Engineering details field. Long text supports paragraphs separated by blank lines. Empty sections stay hidden on the public website.

The Media dropdowns list files in dist/Media. Select photos or videos without re-uploading them. Add slideshow photos in the order you want, and enter descriptions and captions. Slideshow buttons and left/right arrow keys switch photos. Videos have playback controls and an Open video file link. Use + Code block under Code and additional content to paste source code and a language or filename.

Add parts with + Add part. Each part supports name, quantity, picture, purchase or datasheet link, and notes. The parts list appears near the bottom of that project's page. Save website applies all these sections and remembers them for your next editing session.

Under Code and additional content, use Add code files to select one or several plain-text source files (for example .m, .cpp, .ino, or .py). Each file appears collapsed on the project page: click its filename to show the code, and click again to hide it. The editor also lets you replace a file, edit the code, or change its clickable label. Code is included in the saved pages and remembered when reopening the editor.

When moving or publishing the website, keep the Media and assets folders alongside the HTML pages; the optional pages ZIP contains generated pages, not those existing media folders.

Click Save website. It updates the HTML pages and editor starting content directly in dist. Refresh your website to see the changes. No ZIP extraction or folder selection is needed through the launcher. Previous versions are backed up under save-backups.

To view the website, open dist/index.html or visit http://127.0.0.1:8765/index.html while the local editor is running. Your original simulation video remains in dist/assets.

After restarting your computer, double-click Edit Website.cmd again. It starts the local helper if needed and opens the editor. When the helper is already running, the launcher reuses it.

Download editing draft is an optional backup of your editing work. Download pages ZIP is an optional export. Neither is necessary for the normal Save workflow.

If you open editor.html directly as a file, Edge or Chrome can also save after connecting the dist folder. For direct saving in any browser, use Edit Website.cmd.

The website remains local. Save does not publish it online.

CAD files: expand CAD files inside any project and upload one or several CAD models or ZIP archives (up to 20 MB each). Rename their display labels and add descriptions. Visitors get download links; uploaded files are included in the saved website. Add CAD link supports a file path or external URL instead.

Project videos appear in a slideshow with Previous and Next buttons. On the cube page the slideshow sits directly below the simulation. Switching slides pauses the previous video.

Home has an About cover photo control. Upload an image or choose from Media to replace the OS initials; Remove cover image restores the initials.

Under Projects, + Add project creates a new card and opens its blank page in the preview. Fill in its title, summary, engineering details, Motivation, media, code, CAD files, and parts as needed, then Save website.

Code categories: click + Code category and set its Heading (for example Arduino control or MATLAB simulation). Within that category, use Add files to this category to select several source files at once; repeat to append more files. Each filename expands independently on the website. You can replace or remove individual files, or add a blank code file to type code manually. Add code files beneath the sections creates a new category containing all selected files. Existing code blocks are preserved as categories.

Code categories also accept ZIP archives (up to 20 MB each), including alongside source files in the same selection. Click the archive's filename on the website to reveal its Download ZIP link. Archives are retained intact and are included in the saved website.

Section order: expand Section order inside any project and use the up/down arrows to rearrange its sections. This includes the overview, Motivation, engineering details, simulation, media, individual code categories or custom text sections, CAD files, and parts list. The title stays at the top. Empty sections appear on the public page once filled. Save website remembers the order.

Every project supports the cube's overview layout: headline image on the left and three short sections on the right, beneath the title. Under Projects, expand Three short sections to enter their headings and descriptions. The overview moves together when you change section order; on mobile, the image and short sections stack vertically.

Double-click editable text in the preview to open the matching tab, expand its controls, scroll to its field, and focus it. This works for About text, project titles and descriptions, the three short sections, Motivation, engineering details, custom sections, code files, captions, CAD files, and parts. Clicking page links once still navigates through the preview.
