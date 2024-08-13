/* eslint-disable @typescript-eslint/tslint/config */
/********************************************************************************
 * Copyright (C) 2022 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import * as cliProgress from 'cli-progress';
import * as fs from 'fs-extra';
import * as request from 'request';
import * as tar from 'tar-fs';
import gunzip from 'gunzip-maybe';

const LOCAL_DOWNLOAD_TARGET_PATH = './tracecompass-server/';
const LOCAL_DOWNLOAD_TARGET_FILENAME = 'trace-server.tar.gz';
const DOWNLOAD_URL =
  'https://download.eclipse.org/tracecompass.incubator/trace-server/rcp/trace-compass-server-latest-linux.gtk.x86_64.tar.gz';

execute();

export async function execute(): Promise<void> {
  try {
    const archivePath = `${LOCAL_DOWNLOAD_TARGET_PATH}${LOCAL_DOWNLOAD_TARGET_FILENAME}`;
    await clean();
    await download(DOWNLOAD_URL, archivePath);
    await extract(archivePath);
  } catch (error) {
    console.error(error);
  }
}

async function clean(): Promise<void> {
  if (fs.existsSync(LOCAL_DOWNLOAD_TARGET_PATH)) {
    fs.removeSync(LOCAL_DOWNLOAD_TARGET_PATH);
  }
  fs.mkdirsSync(LOCAL_DOWNLOAD_TARGET_PATH);
}

function download(url: string, localTargetPath: string): Promise<void> {
  console.log('Downloading trace compass server...');
  const progress = new cliProgress.SingleBar({ format: '{bar} {percentage}%' });
  const targetFile = fs.createWriteStream(localTargetPath);
  return new Promise<void>((resolve, reject) => {
    let receivedBytes = 0;
    request
      .get(url)
      .on('response', response => {
        if (response.statusCode !== 200) {
          return reject(response);
        }
        const totalBytes = response.headers['content-length'];
        progress.start(totalBytes ? +totalBytes : 1000000, 0);
      })
      .on('data', chunk => {
        receivedBytes += chunk.length;
        progress.update(receivedBytes);
      })
      .pipe(targetFile)
      .on('error', err => {
        fs.unlink(localTargetPath);
        progress.stop();
        return reject(err);
      });

    targetFile.on('error', err => {
      progress.stop();
      fs.unlink(localTargetPath);
      return reject(err);
    });

    targetFile.on('finish', () => {
      progress.stop();
      targetFile.close();
      return resolve();
    });
  });
}

function extract(archivePath: string): Promise<void> {
  console.log('Extracting trace compass server...');
  return new Promise<void>((resolve, reject) => {
    const fsExtract = fs
      .createReadStream(archivePath)
      .pipe(gunzip())
      .pipe(tar.extract(LOCAL_DOWNLOAD_TARGET_PATH));
    fsExtract.on('finish', () => resolve());
    fsExtract.on('error', e => reject(e));
  });
}
