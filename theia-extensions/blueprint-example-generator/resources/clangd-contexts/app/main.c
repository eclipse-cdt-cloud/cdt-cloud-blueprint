/********************************************************************************
 * Copyright (C) 2021 STMicroelectronics and others.
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
#include "files.h"
#include <lib.h>

#ifdef __atom__
 #warning "Arch Intel Atom"
 typedef struct {
     int a;
 } TestStruct_t;
#else
 #warning "Other arch"
  typedef struct {
     float a;
 } TestStruct_t;
#endif

volatile float global_value = 1.234f;

int main() {
    int arr[4] = {1, 2, 3, 4};

    TestStruct_t obj;
    obj.a = global_value + ((float)sum(arr, 4));
    return 0;
}
