# Simple automatization for building an addon

import sys
import os
import shutil

class Const:
    ANKI = 0
    ZIP = 1
    CLEAR = 3



if __name__ == '__main__':
    addonIndex = None
    mode = None
    target = None

    acceptedArgs = ('-source', '-dist', '-dev', '-clear')
    existingAddons = ('fill-the-blanks-expanded',)

    print('====================== Building RSS Addon =====================')

    for index, value in enumerate(sys.argv):
        if value not in acceptedArgs:
            continue

        if value == acceptedArgs[0]:  # source
            if (index + 1) > len(sys.argv) - 1:
                raise IOError('Incorrect parameters. After "-source" there must be a value ')
            addonIndex = int(sys.argv[index + 1])
        elif value == acceptedArgs[1]:
            mode = Const.ZIP  # dist
            target = '/dist'
        elif value == acceptedArgs[2]:
            if mode:
                print('Already set to dist mode. Ignoring -dev')
            else:
                mode = Const.ANKI
                appdata = os.environ.get('APPDATA')
                if not appdata:
                    raise EnvironmentError('APPDATA not found. Unable to resolve Anki addons path.')
                target = os.path.join(appdata, 'Anki2', 'addons21')
        elif value == acceptedArgs[3]:  # clear
            mode = Const.CLEAR
            target = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'dist')

    # -----------------------------------------------------------

    if not addonIndex:

        print('Choose an addon to be processed ===============================')

        for index, name in enumerate(existingAddons):
            print('{} - {}'.format(index + 1, name))

        print('-' * 60)

        addonIndex = int(input('> '))

        if not addonIndex or addonIndex > len(existingAddons):
            raise IOError('It was not possible to determine a valid addon as input')

    addon = existingAddons[addonIndex - 1]

    if not target:
        raise IOError('No mode was informed. Choose either -dev or -dist')
    # -----------------------------------------------------------

    currentDir = os.path.dirname(os.path.realpath(__file__))

    if mode == Const.ZIP:
        if os.path.exists(target):
            print('Cleaning dist directory')
            shutil.rmtree(target)

        print('Copying files')
        shutil.copytree(os.path.join(currentDir, addon.replace('_', '-')), target,
                        ignore=shutil.ignore_patterns('tests', 'doc', '*_test*', '__pycache__'))

        print('Creating binary')
        shutil.make_archive(os.path.join(target, addon), format='zip',
                            root_dir=os.path.join(target, 'src'))

    # copies to anki's addon folder - test integrated
    elif mode == Const.ANKI:
        targetAddonDir = os.path.join(target, addon.replace('-', '_'))
        if os.path.exists(targetAddonDir):
            print('Removing old files: {}'.format(targetAddonDir))
            shutil.rmtree(targetAddonDir)

        print('Copying files to anki directory')
        addonRoot = os.path.join(currentDir, addon)
        shutil.copytree(os.path.join(addonRoot, 'src'), targetAddonDir,
                        ignore=shutil.ignore_patterns('tests', 'doc', '*_test*', '__pycache__'))

    # Deletes from anki addons
    elif mode == Const.CLEAR:
        if os.path.exists(target):
            print('Removing dist directory: {}'.format(target))
            shutil.rmtree(target)
        else:
            print('Dist directory was not found: {}'.format(target))
